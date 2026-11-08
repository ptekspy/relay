/**
 * Remote Geolocation Mocking & GPS Coordinate Injection
 *
 * Intercepts navigator.geolocation.getCurrentPosition and watchPosition
 * to enable real-time GPS coordinate injection and route simulation.
 *
 * Note for Octavia: This enables testing location-aware features without physical movement.
 */

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  accuracy?: number;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
}

export interface MockGeolocationPosition {
  coords: {
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
  };
  timestamp: number;
}

export type PositionCallback = (position: MockGeolocationPosition) => void;
export type PositionErrorCallback = (error: {
  code: number;
  message: string;
}) => void;

export const GEO_PRESETS: Record<string, GeoCoordinates> = {
  London: { latitude: 51.5074, longitude: -0.1278, accuracy: 5 },
  NewYork: { latitude: 40.7128, longitude: -74.006, accuracy: 5 },
  Tokyo: { latitude: 35.6762, longitude: 139.6503, accuracy: 5 },
  Paris: { latitude: 48.8566, longitude: 2.3522, accuracy: 5 },
  SanFrancisco: { latitude: 37.7749, longitude: -122.4194, accuracy: 5 },
};

export interface GeolocationApi {
  getCurrentPosition: (
    success: PositionCallback,
    error?: PositionErrorCallback,
  ) => void;
  watchPosition: (
    success: PositionCallback,
    error?: PositionErrorCallback,
  ) => number;
  clearWatch: (watchId: number) => void;
}

export class GeolocationMockController {
  private enabled = false;
  private currentCoords: GeoCoordinates = {
    latitude: 51.5074,
    longitude: -0.1278,
    accuracy: 5,
  };
  private nextWatchId = 1;
  private readonly watchers = new Map<number, PositionCallback>();

  private originalGetCurrentPosition:
    | ((success: PositionCallback, error?: PositionErrorCallback) => void)
    | null = null;
  private originalWatchPosition:
    | ((success: PositionCallback, error?: PositionErrorCallback) => number)
    | null = null;
  private originalClearWatch: ((watchId: number) => void) | null = null;

  public isEnabled(): boolean {
    return this.enabled;
  }

  public getCoordinates(): GeoCoordinates {
    return { ...this.currentCoords };
  }

  public setCoordinates(coords: GeoCoordinates): void {
    this.currentCoords = {
      ...coords,
      altitude: coords.altitude ?? null,
      accuracy: coords.accuracy ?? 5,
      altitudeAccuracy: coords.altitudeAccuracy ?? null,
      heading: coords.heading ?? null,
      speed: coords.speed ?? null,
    };

    if (this.enabled) {
      this.notifyWatchers();
    }
  }

  public setPreset(name: keyof typeof GEO_PRESETS | string): boolean {
    const preset = GEO_PRESETS[name];
    if (preset) {
      this.setCoordinates(preset);
      return true;
    }
    return false;
  }

  public install(nav: { geolocation?: unknown }): boolean {
    if (!nav || !nav.geolocation) return false;

    const geo = nav.geolocation as GeolocationApi;

    this.originalGetCurrentPosition = geo.getCurrentPosition;
    this.originalWatchPosition = geo.watchPosition;
    this.originalClearWatch = geo.clearWatch;

    this.enabled = true;

    geo.getCurrentPosition = (
      success: PositionCallback,
      error?: PositionErrorCallback,
    ) => {
      if (this.enabled) {
        success(this.createPositionObject());
      } else if (typeof this.originalGetCurrentPosition === "function") {
        this.originalGetCurrentPosition(success, error);
      }
    };

    geo.watchPosition = (
      success: PositionCallback,
      error?: PositionErrorCallback,
    ): number => {
      if (this.enabled) {
        const id = this.nextWatchId++;
        this.watchers.set(id, success);
        success(this.createPositionObject());
        return id;
      }
      if (typeof this.originalWatchPosition === "function") {
        return this.originalWatchPosition(success, error);
      }
      return 0;
    };

    geo.clearWatch = (watchId: number): void => {
      this.watchers.delete(watchId);
      if (typeof this.originalClearWatch === "function") {
        this.originalClearWatch(watchId);
      }
    };

    return true;
  }

  public uninstall(nav: { geolocation?: unknown }): void {
    this.enabled = false;
    this.watchers.clear();

    if (!nav || !nav.geolocation) return;
    const geo = nav.geolocation as Partial<GeolocationApi>;

    if (this.originalGetCurrentPosition) {
      geo.getCurrentPosition = this.originalGetCurrentPosition;
    }
    if (this.originalWatchPosition) {
      geo.watchPosition = this.originalWatchPosition;
    }
    if (this.originalClearWatch) {
      geo.clearWatch = this.originalClearWatch;
    }
  }

  private notifyWatchers(): void {
    const pos = this.createPositionObject();
    for (const watcher of this.watchers.values()) {
      watcher(pos);
    }
  }

  public createPositionObject(): MockGeolocationPosition {
    return {
      coords: {
        latitude: this.currentCoords.latitude,
        longitude: this.currentCoords.longitude,
        altitude: this.currentCoords.altitude ?? null,
        accuracy: this.currentCoords.accuracy ?? 5,
        altitudeAccuracy: this.currentCoords.altitudeAccuracy ?? null,
        heading: this.currentCoords.heading ?? null,
        speed: this.currentCoords.speed ?? null,
      },
      timestamp: Date.now(),
    };
  }
}
