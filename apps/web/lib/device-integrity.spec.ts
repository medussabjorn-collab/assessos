import { matchesVMRenderer, matchesVirtualCameraLabel } from './device-integrity';

describe('matchesVMRenderer', () => {
  it('flags known VM/software renderer strings', () => {
    expect(matchesVMRenderer('Google SwiftShader')).toBe(true);
    expect(matchesVMRenderer('ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver)')).toBe(true);
    expect(matchesVMRenderer('llvmpipe (LLVM 15.0.7, 256 bits)')).toBe(true);
    expect(matchesVMRenderer('VMware, Inc. -- VMware SVGA 3D')).toBe(true);
    expect(matchesVMRenderer('VirtualBox Graphics Adapter')).toBe(true);
    expect(matchesVMRenderer('Parallels Display Adapter (WDDM)')).toBe(true);
    expect(matchesVMRenderer('Microsoft Basic Render Driver')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(matchesVMRenderer('SWIFTSHADER')).toBe(true);
  });

  it('does not flag real GPU renderer strings', () => {
    expect(matchesVMRenderer('ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Direct3D11 vs_5_0 ps_5_0, D3D11)')).toBe(false);
    expect(matchesVMRenderer('ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)')).toBe(false);
    expect(matchesVMRenderer('AMD Radeon RX 7800 XT')).toBe(false);
    expect(matchesVMRenderer('Apple M2')).toBe(false);
  });
});

describe('matchesVirtualCameraLabel', () => {
  it('flags known virtual-camera/injection-software labels', () => {
    expect(matchesVirtualCameraLabel('OBS Virtual Camera')).toBe(true);
    expect(matchesVirtualCameraLabel('ManyCam Virtual Webcam')).toBe(true);
    expect(matchesVirtualCameraLabel('Snap Camera')).toBe(true);
    expect(matchesVirtualCameraLabel('XSplit VCam')).toBe(true);
    expect(matchesVirtualCameraLabel('Iriun Webcam')).toBe(true);
    expect(matchesVirtualCameraLabel('DroidCam Source 2')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(matchesVirtualCameraLabel('OBS VIRTUAL CAMERA')).toBe(true);
  });

  it('does not flag common real webcam device labels', () => {
    expect(matchesVirtualCameraLabel('Logitech BRIO')).toBe(false);
    expect(matchesVirtualCameraLabel('HD Pro Webcam C920')).toBe(false);
    expect(matchesVirtualCameraLabel('Integrated Camera')).toBe(false);
    expect(matchesVirtualCameraLabel('FaceTime HD Camera')).toBe(false);
    expect(matchesVirtualCameraLabel('Microsoft LifeCam HD-3000')).toBe(false);
    expect(matchesVirtualCameraLabel('Razer Kiyo')).toBe(false);
  });

  it('does not flag common real microphone device labels', () => {
    expect(matchesVirtualCameraLabel('Default - MacBook Pro Microphone')).toBe(false);
    expect(matchesVirtualCameraLabel('Headset Microphone (Realtek(R) Audio)')).toBe(false);
  });
});
