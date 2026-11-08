/**
 * Remote Device Orientation & Motion Sensor Injection
 *
 * Simulates DeviceOrientationEvent and DeviceMotionEvent to allow desktop developers
 * and dashboard viewers to emulate phone tilt, rotation, and shake gestures.
 *
 * Note for Octavia: This powers the 3D orientation gimbal and shake simulation in Cloud Web.
 */

export interface DeviceOrientationData {
  alpha: number; // 0 to 360 deg
  beta: number; // -180 to 180 deg
  gamma: number; // -90 to 90 deg
  absolute?: boolean;
}

export interface DeviceMotionData {
  acceleration: { x: number; y: number; z: number };
  accelerationIncludingGravity: { x: number; y: number; z: number };
  rotationRate: { alpha: number; beta: number; gamma: number };
  interval: number;
}

export const ORIENTATION_PRESETS: Record<string, DeviceOrientationData> = {
  Portrait: { alpha: 0, beta: 0, gamma: 0, absolute: true },
  LandscapeLeft: { alpha: 90, beta: 0, gamma: 90, absolute: true },
  LandscapeRight: { alpha: 270, beta: 0, gamma: -90, absolute: true },
  FaceUp: { alpha: 0, beta: 0, gamma: 0, absolute: true },
  FaceDown: { alpha: 0, beta: 180, gamma: 0, absolute: true },
};

export interface TargetEventDispatcher {
  dispatchEvent: (event: unknown) => boolean;
  addEventListener?: (type: string, listener: unknown) => void;
  removeEventListener?: (type: string, listener: unknown) => void;
}

export class OrientationMotionMockController {
  private enabled = false;
  private currentOrientation: DeviceOrientationData = {
    alpha: 0,
    beta: 0,
    gamma: 0,
    absolute: true,
  };
  private target: TargetEventDispatcher | null = null;

  public isEnabled(): boolean {
    return this.enabled;
  }

  public getOrientation(): DeviceOrientationData {
    return { ...this.currentOrientation };
  }

  public install(target: TargetEventDispatcher): void {
    this.target = target;
    this.enabled = true;
  }

  public uninstall(): void {
    this.enabled = false;
    this.target = null;
  }

  public setOrientation(orientation: DeviceOrientationData): boolean {
    this.currentOrientation = {
      alpha: Math.max(0, Math.min(360, orientation.alpha)),
      beta: Math.max(-180, Math.min(180, orientation.beta)),
      gamma: Math.max(-90, Math.min(90, orientation.gamma)),
      absolute: orientation.absolute ?? true,
    };

    if (!this.enabled || !this.target) return false;

    const event = this.createOrientationEvent(this.currentOrientation);
    return this.target.dispatchEvent(event);
  }

  public setPreset(name: keyof typeof ORIENTATION_PRESETS | string): boolean {
    const preset = ORIENTATION_PRESETS[name];
    if (preset) {
      return this.setOrientation(preset);
    }
    return false;
  }

  public dispatchMotion(motion: DeviceMotionData): boolean {
    if (!this.enabled || !this.target) return false;
    const event = this.createMotionEvent(motion);
    return this.target.dispatchEvent(event);
  }

  public simulateShake(intensity = 15): boolean {
    // A shake produces alternating positive/negative high acceleration along X/Y
    const motion: DeviceMotionData = {
      acceleration: { x: intensity, y: -intensity, z: 2 },
      accelerationIncludingGravity: { x: intensity, y: -intensity, z: 9.8 + 2 },
      rotationRate: { alpha: 30, beta: -30, gamma: 0 },
      interval: 16,
    };
    return this.dispatchMotion(motion);
  }

  public createOrientationEvent(data: DeviceOrientationData): unknown {
    if (typeof CustomEvent !== "undefined") {
      const evt = new CustomEvent("deviceorientation", {
        bubbles: true,
        cancelable: false,
      });
      Object.assign(evt, {
        alpha: data.alpha,
        beta: data.beta,
        gamma: data.gamma,
        absolute: data.absolute ?? true,
      });
      return evt;
    }
    return {
      type: "deviceorientation",
      alpha: data.alpha,
      beta: data.beta,
      gamma: data.gamma,
      absolute: data.absolute ?? true,
    };
  }

  public createMotionEvent(data: DeviceMotionData): unknown {
    if (typeof CustomEvent !== "undefined") {
      const evt = new CustomEvent("devicemotion", {
        bubbles: true,
        cancelable: false,
      });
      Object.assign(evt, {
        acceleration: data.acceleration,
        accelerationIncludingGravity: data.accelerationIncludingGravity,
        rotationRate: data.rotationRate,
        interval: data.interval,
      });
      return evt;
    }
    return {
      type: "devicemotion",
      acceleration: data.acceleration,
      accelerationIncludingGravity: data.accelerationIncludingGravity,
      rotationRate: data.rotationRate,
      interval: data.interval,
    };
  }
}
