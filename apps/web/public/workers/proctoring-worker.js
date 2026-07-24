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
 * FACE_AWAY, ERROR.
 */

importScripts('/vendor/face-api.js');

let modelsLoaded = false;
let canvas = null;
let ctx = null;

// Throttle: process one frame every N ms.
const FRAME_INTERVAL_MS = 800;
let lastProcessed = 0;

// Consecutive no-face frames before raising an event.
let consecutiveNoFace = 0;
const NO_FACE_THRESHOLD = 3;

self.onmessage = async (e) => {
  const msg = e.data;

  switch (msg.type) {
    case 'INIT': {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(msg.modelsUrl);
        await faceapi.nets.faceLandmark68TinyNet.loadFromUri(msg.modelsUrl);
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
