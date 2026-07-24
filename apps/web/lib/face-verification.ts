'use client';

import * as faceapi from '@vladmandic/face-api';

// Same three models the existing violation-detection worker uses
// (tinyFaceDetector, faceLandmark68TinyNet) plus faceRecognitionNet, which
// wasn't previously vendored — public/models had no descriptor model until
// now, so no real face-match score was computable client-side. Loaded on
// the main thread (not the worker) since this runs once per verification
// action, not per animation frame.
let loadPromise: Promise<void> | null = null;

export function loadFaceModels(modelsUrl = '/models'): Promise<void> {
  if (!loadPromise) {
    loadPromise = Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(modelsUrl),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri(modelsUrl),
      faceapi.nets.faceRecognitionNet.loadFromUri(modelsUrl),
    ]).then(() => undefined);
  }
  return loadPromise;
}

type ImageSource = HTMLVideoElement | HTMLCanvasElement | HTMLImageElement;

// Detection confidence only — used for the document-photo check ("is a face
// visible on this ID photo at all"). This is NOT document authenticity/OCR;
// no document-verification vendor is integrated, so documentVerified/
// documentScore only ever reflect this real but narrow signal.
export async function detectFaceConfidence(source: ImageSource): Promise<number> {
  const detection = await faceapi
    .detectSingleFace(source, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 }))
    .withFaceLandmarks(true);
  return detection?.detection.score ?? 0;
}

// Real 128-d face descriptor via faceRecognitionNet. Returns null if no
// single face is confidently detected.
export async function captureDescriptor(source: ImageSource): Promise<Float32Array | null> {
  const detection = await faceapi
    .detectSingleFace(source, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 }))
    .withFaceLandmarks(true)
    .withFaceDescriptor();
  return detection?.descriptor ?? null;
}

// Maps face-api's euclidean descriptor distance to the 0-1 "confidence"
// scale IdentityService.computeStatus expects (FACE_MATCH_MIN = 0.8).
// Quadratic falloff against face-api's commonly-cited 0.6 distance
// threshold (below 0.6 = same person), so the "clearly a match" zone near
// 0 stays close to 1 and only the region near the mismatch boundary gets
// harshly penalized. A linear falloff (score = 1 - distance/0.6) was
// tried first and was too harsh in practice — a real two-selfie capture of
// the same person a few seconds apart measured distance 0.24 (a confident
// same-person match by face-api's own standard), which the linear mapping
// scored only 0.6, below FACE_MATCH_MIN, forcing manual_review on a
// genuine match. Quadratic scores that same 0.24 at 0.84.
export function matchScore(a: Float32Array, b: Float32Array): number {
  const distance = faceapi.euclideanDistance(a, b);
  const ratio = Math.max(0, Math.min(1, distance / 0.6));
  return 1 - ratio * ratio;
}

export function captureVideoFrame(video: HTMLVideoElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 320;
  canvas.height = video.videoHeight || 240;
  const ctx = canvas.getContext('2d');
  ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas;
}
