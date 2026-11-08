export interface WebGlProbeResult {
  supported: boolean;
  renderer?: string;
  vendor?: string;
}

export function probeWebGlSupport(): WebGlProbeResult {
  if (typeof document === "undefined") {
    return { supported: false };
  }

  try {
    const canvas = document.createElement("canvas");
    const gl =
      (canvas.getContext("webgl") as WebGLRenderingContext | null) ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);

    if (!gl) {
      return { supported: false };
    }

    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = debugInfo
      ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      : undefined;
    const vendor = debugInfo
      ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
      : undefined;

    return {
      supported: true,
      renderer: typeof renderer === "string" ? renderer : undefined,
      vendor: typeof vendor === "string" ? vendor : undefined,
    };
  } catch {
    return { supported: false };
  }
}
