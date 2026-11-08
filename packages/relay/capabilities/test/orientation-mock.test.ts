import { describe, expect, it } from "bun:test";
import {
  ORIENTATION_PRESETS,
  OrientationMotionMockController,
  type TargetEventDispatcher,
} from "../src/orientation-mock.js";

describe("TASK-133: Remote Device Orientation & Motion Sensor Injection", () => {
  const createMockDispatcher = () => {
    const dispatched: unknown[] = [];
    const target: TargetEventDispatcher = {
      dispatchEvent: (evt: unknown) => {
        dispatched.push(evt);
        return true;
      },
    };
    return { target, dispatched };
  };

  it("dispatches synthetic deviceorientation event matching specified angles", () => {
    const { target, dispatched } = createMockDispatcher();
    const controller = new OrientationMotionMockController();

    controller.install(target);
    expect(controller.isEnabled()).toBe(true);

    const success = controller.setOrientation({
      alpha: 180,
      beta: 45,
      gamma: -30,
    });
    expect(success).toBe(true);
    expect(dispatched.length).toBe(1);

    const evt = dispatched[0] as {
      type: string;
      alpha: number;
      beta: number;
      gamma: number;
    };
    expect(evt.type).toBe("deviceorientation");
    expect(evt.alpha).toBe(180);
    expect(evt.beta).toBe(45);
    expect(evt.gamma).toBe(-30);
  });

  it("applies orientation presets and clamps angles within valid ranges", () => {
    const { target, dispatched } = createMockDispatcher();
    const controller = new OrientationMotionMockController();
    controller.install(target);

    controller.setPreset("LandscapeLeft");
    const presetEvt = dispatched[0] as {
      alpha: number;
      beta: number;
      gamma: number;
    };
    expect(presetEvt.alpha).toBe(
      ORIENTATION_PRESETS.LandscapeLeft?.alpha ?? 90,
    );
    expect(presetEvt.gamma).toBe(
      ORIENTATION_PRESETS.LandscapeLeft?.gamma ?? 90,
    );

    // Test angle clamping
    controller.setOrientation({ alpha: 400, beta: -250, gamma: 120 });
    const clampedEvt = dispatched[1] as {
      alpha: number;
      beta: number;
      gamma: number;
    };
    expect(clampedEvt.alpha).toBe(360);
    expect(clampedEvt.beta).toBe(-180);
    expect(clampedEvt.gamma).toBe(90);
  });

  it("dispatches devicemotion event during simulated shake gesture", () => {
    const { target, dispatched } = createMockDispatcher();
    const controller = new OrientationMotionMockController();
    controller.install(target);

    const shaken = controller.simulateShake(20);
    expect(shaken).toBe(true);
    expect(dispatched.length).toBe(1);

    const motionEvt = dispatched[0] as {
      type: string;
      acceleration: { x: number; y: number; z: number };
    };
    expect(motionEvt.type).toBe("devicemotion");
    expect(motionEvt.acceleration.x).toBe(20);
    expect(motionEvt.acceleration.y).toBe(-20);
  });

  it("stops dispatching events after uninstallation", () => {
    const { target, dispatched } = createMockDispatcher();
    const controller = new OrientationMotionMockController();
    controller.install(target);
    controller.uninstall();

    expect(controller.isEnabled()).toBe(false);
    const result = controller.setOrientation({ alpha: 0, beta: 0, gamma: 0 });
    expect(result).toBe(false);
    expect(dispatched.length).toBe(0);
  });
});
