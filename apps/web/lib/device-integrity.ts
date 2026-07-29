// Best-effort, honest device-integrity heuristics for the pre-session room
// scan. Both signals below are well-precedented in anti-fraud tooling but
// are NOT a strong security boundary: a renamed virtual-camera device, GPU
// passthrough, or a spoofed WebGL renderer string would evade them. They
// catch the common/naive case, not a determined adversary — reporting a
// false negative with unearned confidence would be worse than reporting
// nothing, same principle as the rest of this proctoring module.

// Known software/virtual GPU renderer signatures. A VM guest without GPU
// passthrough reports one of these from WEBGL_debug_renderer_info instead of
// real hardware.
const VM_RENDERER_SIGNATURES = [
  'swiftshader',
  'llvmpipe',
  'vmware svga',
  'virtualbox graphics',
  'parallels display',
  'microsoft basic render driver',
  'basic render driver',
  'google swiftshader',
  'mesa offscreen',
  'apple software renderer',
];

export function matchesVMRenderer(renderer: string): boolean {
  const lower = renderer.toLowerCase();
  return VM_RENDERER_SIGNATURES.some((sig) => lower.includes(sig));
}

// Known virtual-camera / webcam-injection software. This is the more
// directly relevant signal for this app's actual threat model — someone
// feeding a fabricated or pre-recorded video into face-verification/room-scan
// via a virtual camera driver rather than a real webcam.
const VIRTUAL_CAMERA_LABEL_SIGNATURES = [
  'obs virtual camera',
  'obs-camera',
  'manycam',
  'snap camera',
  'xsplit vcam',
  'xsplit broadcaster',
  'camtwist',
  'iriun',
  'droidcam',
  'ivcam',
  'ndi virtual',
  'virtual camera',
  'virtual webcam',
  'epoccam',
  'e2esoft vcam',
];

export function matchesVirtualCameraLabel(label: string): boolean {
  const lower = label.toLowerCase();
  return VIRTUAL_CAMERA_LABEL_SIGNATURES.some((sig) => lower.includes(sig));
}

// Reads the real WebGL renderer string via a throwaway canvas — requires the
// WEBGL_debug_renderer_info extension, which most browsers expose (Chrome/
// Edge/Firefox) but is allowed to be blocked by privacy settings/extensions;
// unavailable means "can't tell," not "clean," so this returns false rather
// than guessing.
export function detectVirtualMachine(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return false;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (!ext) return false;
    const renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) as string;
    return typeof renderer === 'string' && matchesVMRenderer(renderer);
  } catch {
    return false;
  }
}

// Enumerates real media devices and checks video/audio input labels against
// known virtual-camera/injection-software names. Device labels are often
// empty strings until getUserMedia has been granted at least once in the
// current page (a browser privacy measure) — callers should invoke this
// after camera permission has already been granted, which the room-scan
// flow always does before calling this.
export async function detectVirtualCamera(): Promise<boolean> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.some(
      (d) => (d.kind === 'videoinput' || d.kind === 'audioinput') && matchesVirtualCameraLabel(d.label),
    );
  } catch {
    return false;
  }
}
