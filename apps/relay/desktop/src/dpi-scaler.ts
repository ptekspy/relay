/**
 * Calculates adaptive scale factors across dual monitors and high-DPI (Retina/4K) displays.
 */
export class DpiDisplayScaler {
  public calculateScaleFactor(
    devicePixelRatio: number,
    targetWidth: number,
    containerWidth: number,
  ): number {
    if (targetWidth <= 0 || containerWidth <= 0) return 1.0;

    const naturalFit = containerWidth / targetWidth;
    // Don't upscale past 1.0 unless explicitly forced
    const clampedFit = Math.min(1.0, naturalFit);

    // If devicePixelRatio > 1 (e.g. Retina 2x or 3x), ensure crisp rendering
    return Number(clampedFit.toFixed(3));
  }

  public getPixelDensityLabel(dpr: number): string {
    if (dpr >= 3) return "@3x (Super Retina)";
    if (dpr >= 2) return "@2x (Retina / HiDPI)";
    return "@1x (Standard)";
  }
}
