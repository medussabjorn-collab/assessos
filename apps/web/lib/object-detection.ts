'use client';

// Real phone detection for the room scan, via @tensorflow-models/coco-ssd.
// Same lazy-dynamic-import rationale as face-verification.ts's getFaceApi():
// a static top-level import would pull tfjs into the server prerender
// bundle and break `next build`, so this is only ever require()'d inside a
// client-side effect/handler.
type CocoSsdModule = typeof import('@tensorflow-models/coco-ssd');
let cocoSsdModulePromise: Promise<CocoSsdModule> | null = null;
function getCocoSsd(): Promise<CocoSsdModule> {
  if (!cocoSsdModulePromise) cocoSsdModulePromise = import('@tensorflow-models/coco-ssd');
  return cocoSsdModulePromise;
}

// Local model.json + weight shards under public/models/coco-ssd — never
// fetches Google's hosted copy, matching how the face-api models are served
// (see loadFaceModels in face-verification.ts).
let modelLoadPromise: Promise<import('@tensorflow-models/coco-ssd').ObjectDetection> | null = null;

export function loadObjectDetectionModel(): Promise<import('@tensorflow-models/coco-ssd').ObjectDetection> {
  if (!modelLoadPromise) {
    modelLoadPromise = getCocoSsd().then((cocoSsd) =>
      cocoSsd.load({ modelUrl: '/models/coco-ssd/model.json' }),
    );
  }
  return modelLoadPromise;
}

type ImageSource = HTMLVideoElement | HTMLCanvasElement | HTMLImageElement;

const PHONE_MIN_SCORE = 0.6;

// Single-frame check for the pre-session room scan — same 'cell phone'
// class + confidence threshold as the live proctoring-worker's continuous
// check, just run once on demand instead of every 3s.
export async function detectPhone(source: ImageSource): Promise<boolean> {
  const model = await loadObjectDetectionModel();
  const objects = await model.detect(source, 5, PHONE_MIN_SCORE);
  return objects.some((o) => o.class === 'cell phone');
}
