/**
 * Proctoring worker — runs face-api.js off the main thread.
 * Classic (non-module) worker loaded via new Worker('/workers/proctoring-worker.js')
 * — Next.js webpack doesn't auto-bundle `new Worker(new URL(...))` the way Vite
 * does, so this is a static asset that loads face-api via importScripts rather
 * than an ES module import. Ported from leadership-assessment's
 * src/workers/proctoring.worker.ts — logic kept as close to 1:1 as the
 * classic-worker/UMD constraints allow.
 *
 * Receives ImageBitmap frames from useAIProctoring, runs face detection,
 * posts typed events back: READY, FACE_DETECTED, NO_FACE, MULTIPLE_FACES,
 * FACE_AWAY, PHONE_DETECTED, ERROR.
 */

importScripts('/vendor/face-api.js');
// coco-ssd.min.js's UMD build reads the `tf` global directly rather than
// bundling tfjs-core itself (see e.tf reference in its factory function) —
// tf.min.js must load first.
importScripts('/vendor/tf.min.js');
importScripts('/vendor/coco-ssd.min.js');

// face-api.js auto-detects its runtime environment at load time via
// `isBrowser()`, which checks `typeof window !== 'undefined'` — that's
// never true in ANY Worker (real browser or otherwise; Workers only have
// `self`), so face-api's internal env singleton never initializes here,
// and every call touching Canvas/Image throws "getEnv - environment is not
// defined". This was a real, silent bug affecting every real user: the
// face-detection loop never produced NO_FACE/MULTIPLE_FACES/FACE_AWAY
// events because INIT always failed before ever reaching READY.
//
// Fix: explicitly supply a Worker-compatible environment. Image/Video use
// distinct empty placeholder classes rather than a shared stand-in like
// `Object` — using the same class for both (or `Object`, which everything
// is `instanceof`) makes face-api's internal `instanceof` checks
// misclassify the OffscreenCanvas frame as an Image/Video, sending it down
// a dead-end path that either throws on undefined naturalWidth/naturalHeight
// or hangs forever awaiting a 'load' event a canvas never fires.
class NoImage {}
class NoVideo {}
faceapi.env.setEnv({
  Canvas: OffscreenCanvas,
  CanvasRenderingContext2D: typeof OffscreenCanvasRenderingContext2D !== 'undefined' ? OffscreenCanvasRenderingContext2D : NoImage,
  Image: NoImage,
  ImageData,
  Video: NoVideo,
  createCanvasElement: () => new OffscreenCanvas(1, 1),
  createImageElement: () => {
    throw new Error('createImageElement not supported in worker');
  },
  fetch: self.fetch.bind(self),
  readFile: () => {
    throw new Error('readFile not supported in worker');
  },
});

let modelsLoaded = false;
let objectModel = null;
let canvas = null;
let ctx = null;

// Throttle: process one frame every N ms.
const FRAME_INTERVAL_MS = 800;
let lastProcessed = 0;

// Object detection (phone) is far more expensive than the tiny face
// detector — runs on a much slower cadence, piggybacking on whichever
// FRAME tick crosses this interval rather than every face-detection tick.
const OBJECT_FRAME_INTERVAL_MS = 3000;
let lastObjectProcessed = 0;

// Consecutive no-face frames before raising an event.
let consecutiveNoFace = 0;
const NO_FACE_THRESHOLD = 3;

const PHONE_MIN_SCORE = 0.6;

self.onmessage = async (e) => {
  const msg = e.data;

  switch (msg.type) {
    case 'INIT': {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(msg.modelsUrl);
        await faceapi.nets.faceLandmark68TinyNet.loadFromUri(msg.modelsUrl);
        // Local model.json + shards under public/models/coco-ssd — never
        // fetches Google's hosted CDN copy, same offline-capable pattern as
        // the face-api models above.
        objectModel = await cocoSsd.load({ modelUrl: '/models/coco-ssd/model.json' });
        modelsLoaded = true;
        self.postMessage({ kind: 'READY' });
      } catch (err) {
        self.postMessage({ kind: 'ERROR', message: String(err) });
      }
      break;
    }

    case 'FRAME': {
      if (!modelsLoaded) return;

      const now = Date.now();
      if (now - lastProcessed < FRAME_INTERVAL_MS) {
        // Fix vs the ported source: it returned here without closing the
        // bitmap, leaking one ImageBitmap per throttled frame.
        msg.bitmap.close();
        return;
      }
      lastProcessed = now;

      try {
        if (!canvas || canvas.width !== msg.width || canvas.height !== msg.height) {
          canvas = new OffscreenCanvas(msg.width, msg.height);
          ctx = canvas.getContext('2d');
        }
        ctx.drawImage(msg.bitmap, 0, 0);
        msg.bitmap.close();

        if (now - lastObjectProcessed >= OBJECT_FRAME_INTERVAL_MS) {
          lastObjectProcessed = now;
          // Fire-and-forget on its own cadence — never blocks the face-
          // detection path below, and a slow/failed inference just skips
          // this tick rather than stalling FRAME processing.
          objectModel
            .detect(canvas, 5, PHONE_MIN_SCORE)
            .then((objects) => {
              const phone = objects.find((o) => o.class === 'cell phone');
              if (phone) self.postMessage({ kind: 'PHONE_DETECTED', ts: now, score: phone.score });
            })
            .catch(() => {
              // Skip this tick — don't crash the worker on a bad frame.
            });
        }

        const detections = await faceapi
          .detectAllFaces(canvas, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 }))
          .withFaceLandmarks(true);

        if (detections.length === 0) {
          consecutiveNoFace++;
          if (consecutiveNoFace >= NO_FACE_THRESHOLD) {
            self.postMessage({ kind: 'NO_FACE', ts: now });
          }
        } else {
          consecutiveNoFace = 0;

          if (detections.length > 1) {
            self.postMessage({ kind: 'MULTIPLE_FACES', ts: now, count: detections.length });
            return;
          }

          // Gaze direction from nose tip vs eye midpoint (rough % offset,
          // not a full 3D pose solve — same heuristic as the ported source).
          const lm = detections[0].landmarks;
          const nose = lm.getNose()[3];
          const leftEye = lm.getLeftEye();
          const rightEye = lm.getRightEye();

          const eyeMidX = (leftEye[0].x + rightEye[3].x) / 2;
          const eyeMidY = (leftEye[0].y + rightEye[3].y) / 2;

          const yaw = ((nose.x - eyeMidX) / msg.width) * 100;
          const pitch = ((nose.y - eyeMidY) / msg.height) * 100;

          const YAW_THRESHOLD = 15;
          const PITCH_THRESHOLD = 12;

          if (Math.abs(yaw) > YAW_THRESHOLD || Math.abs(pitch) > PITCH_THRESHOLD) {
            self.postMessage({ kind: 'FACE_AWAY', ts: now, yaw, pitch });
          } else {
            self.postMessage({ kind: 'FACE_DETECTED', ts: now });
          }
        }
      } catch (err) {
        // Silently skip — don't crash the worker on a bad frame.
      }
      break;
    }

    case 'STOP':
      self.close();
      break;
  }
};
