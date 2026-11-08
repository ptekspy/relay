import { describe, expect, it } from "bun:test";
import type { GeolocationApi } from "../src/geolocation-mock.js";
import {
  GEO_PRESETS,
  GeolocationMockController,
} from "../src/geolocation-mock.js";

describe("TASK-132: Remote Geolocation Mocking & GPS Coordinate Injection", () => {
  const createMockNavigator = (): { geolocation: GeolocationApi } => {
    return {
      geolocation: {
        getCurrentPosition: (_success, _error) => {},
        watchPosition: (_success, _error) => 1,
        clearWatch: (_watchId) => {},
      },
    };
  };

  it("intercepts getCurrentPosition and returns active mock coordinates", () => {
    const nav = createMockNavigator();
    const controller = new GeolocationMockController();
    controller.install(nav);

    let receivedLat = 0;
    let receivedLng = 0;

    nav.geolocation.getCurrentPosition((pos) => {
      receivedLat = pos.coords.latitude;
      receivedLng = pos.coords.longitude;
    });

    expect(receivedLat).toBe(GEO_PRESETS.London?.latitude ?? 0);
    expect(receivedLng).toBe(GEO_PRESETS.London?.longitude ?? 0);
  });

  it("updates position and instantly notifies active watchPosition subscribers on coordinate change", () => {
    const nav = createMockNavigator();
    const controller = new GeolocationMockController();
    controller.install(nav);

    const positions: Array<{ lat: number; lng: number }> = [];
    nav.geolocation.watchPosition((pos) => {
      positions.push({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });

    expect(positions.length).toBe(1); // initial emission

    // Switch to Tokyo preset
    controller.setPreset("Tokyo");
    expect(positions.length).toBe(2);
    expect(positions[1]?.lat).toBe(GEO_PRESETS.Tokyo?.latitude);
    expect(positions[1]?.lng).toBe(GEO_PRESETS.Tokyo?.longitude);

    // Custom coordinates (e.g. Paris custom)
    controller.setCoordinates({ latitude: 48.8566, longitude: 2.3522 });
    expect(positions.length).toBe(3);
    expect(positions[2]?.lat).toBe(48.8566);
  });

  it("clears watch subscriber on clearWatch", () => {
    const nav = createMockNavigator();
    const controller = new GeolocationMockController();
    controller.install(nav);

    let callCount = 0;
    const watchId = nav.geolocation.watchPosition(() => {
      callCount++;
    });

    expect(callCount).toBe(1);
    nav.geolocation.clearWatch(watchId);

    controller.setCoordinates({ latitude: 10, longitude: 20 });
    expect(callCount).toBe(1); // not called again
  });

  it("uninstalls cleanly and restores original geolocation methods", () => {
    const nav = createMockNavigator();
    const origGetCurrent = nav.geolocation.getCurrentPosition;
    const controller = new GeolocationMockController();

    controller.install(nav);
    expect(nav.geolocation.getCurrentPosition).not.toBe(origGetCurrent);

    controller.uninstall(nav);
    expect(nav.geolocation.getCurrentPosition).toBe(origGetCurrent);
    expect(controller.isEnabled()).toBe(false);
  });
});
