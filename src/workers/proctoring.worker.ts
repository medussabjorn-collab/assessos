/// <reference lib="webworker" />
/**
 * Proctoring Web Worker — runs face-api.js off the main thread.
 * Receives ImageBitmap frames from the AssessmentEngine, runs face detection,
 * and posts typed events back.
 */

import * as faceapi from '@vladmandic/face-api';

type WorkerInMessage =
  | { type: 'INIT'; modelsUrl: string }
  | { type: 'FRAME'; bitmap: ImageBitmap; width: number; height: number }
  | { type: 'STOP' };

export type ProctoringEvent =
  | { kind: 'NO_FACE';          ts: number }
  | { kind: 'MULTIPLE_FACES';   ts: number; count: number }
  | { kind: 'FACE_AWAY';        ts: number; yaw: number; pitch: number }
  | { kind: 'FACE_DETECTED';    ts: number }
  | { kind: 'READY' }
  | { kind: 'ERROR';            message: string };

let modelsLoaded = false;
// OffscreenCanvas for drawing frames before passing to face-api
let canvas: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;

// Throttle: process one frame every N ms
const FRAME_INTERVAL_MS = 800;
let lastProcessed = 0;

// Consecutive no-face frames before raising an event
let consecutiveNoFace = 0;
const NO_FACE_THRESHOLD = 3;

self.onmessage = async (e: MessageEvent<WorkerInMessage>) => {
  const msg = e.data;

  switch (msg.type) {
    case 'INIT': {
      try {
        // Load models from the provided URL (served from /models)
        await faceapi.nets.tinyFaceDetector.loadFromUri(msg.modelsUrl);
        await faceapi.nets.faceLandmark68TinyNet.loadFromUri(msg.modelsUrl);
        modelsLoaded = true;
        self.postMessage({ kind: 'READY' } satisfies ProctoringEvent);
      } catch (err) {
        self.postMessage({ kind: 'ERROR', message: String(err) } satisfies ProctoringEvent);
      }
      break;
    }

    case 'FRAME': {
      if (!modelsLoaded) return;

      const now = Date.now();
      if (now - lastProcessed < FRAME_INTERVAL_MS) return;
      lastProcessed = now;

      try {
        // Reuse or create OffscreenCanvas
        if (!canvas || canvas.width !== msg.width || canvas.height !== msg.height) {
          canvas = new OffscreenCanvas(msg.width, msg.height);
          ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
        }
        ctx!.drawImage(msg.bitmap, 0, 0);
        msg.bitmap.close();

        const detections = await faceapi
          .detectAllFaces(canvas as unknown as HTMLCanvasElement, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 }))
          .withFaceLandmarks(true);

        if (detections.length === 0) {
          consecutiveNoFace++;
          if (consecutiveNoFace >= NO_FACE_THRESHOLD) {
            self.postMessage({ kind: 'NO_FACE', ts: now } satisfies ProctoringEvent);
          }
        } else {
          consecutiveNoFace = 0;

          if (detections.length > 1) {
            self.postMessage({ kind: 'MULTIPLE_FACES', ts: now, count: detections.length } satisfies ProctoringEvent);
            return;
          }

          // Check gaze direction using nose tip vs eye midpoints
          const lm = detections[0].landmarks;
          const nose    = lm.getNose()[3];          // nose tip
          const leftEye  = lm.getLeftEye();
          const rightEye = lm.getRightEye();

          const eyeMidX = (leftEye[0].x + rightEye[3].x) / 2;
          const eyeMidY = (leftEye[0].y + rightEye[3].y) / 2;

          const yaw   = (nose.x - eyeMidX) / msg.width  * 100;   // rough % offset
          const pitch = (nose.y - eyeMidY) / msg.height * 100;

          const YAW_THRESHOLD   = 15;
          const PITCH_THRESHOLD = 12;

          if (Math.abs(yaw) > YAW_THRESHOLD || Math.abs(pitch) > PITCH_THRESHOLD) {
            self.postMessage({ kind: 'FACE_AWAY', ts: now, yaw, pitch } satisfies ProctoringEvent);
          } else {
            self.postMessage({ kind: 'FACE_DETECTED', ts: now } satisfies ProctoringEvent);
          }
        }
      } catch (err) {
        // Silently skip — don't crash the worker on a bad frame
      }
      break;
    }

    case 'STOP': {
      self.close();
      break;
    }
  }
};
