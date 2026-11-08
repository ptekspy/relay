import type { RelayTelemetryEvent } from "@paddy-systems/relay-protocol";
import { EventRingBuffer, type TransportEmitter } from "./buffer.js";
import { ConsoleInterceptor } from "./console.js";
import { ErrorInterceptor } from "./errors.js";
import { NetworkInterceptor } from "./network.js";
import { PointerTracker } from "./pointer.js";
import { ViewportTracker } from "./viewport.js";

export interface RelayAgentConfig {
  ringBufferCapacity?: number;
  emitter?: TransportEmitter;
  captureConsole?: boolean;
  captureNetwork?: boolean;
  captureErrors?: boolean;
  captureViewport?: boolean;
  captureTouch?: boolean;
}

export class RelayAgent {
  private readonly buffer: EventRingBuffer;
  private readonly consoleInterceptor: ConsoleInterceptor;
  private readonly networkInterceptor: NetworkInterceptor;
  private readonly errorInterceptor: ErrorInterceptor;
  private readonly viewportTracker: ViewportTracker;
  private readonly pointerTracker: PointerTracker;
  private isRunning = false;

  constructor(private readonly config: RelayAgentConfig = {}) {
    this.buffer = new EventRingBuffer(config.ringBufferCapacity ?? 500);

    if (config.emitter) {
      this.buffer.attachEmitter(config.emitter);
    }

    const pushEvent = (event: RelayTelemetryEvent) => {
      this.buffer.push(event);
    };

    this.consoleInterceptor = new ConsoleInterceptor(pushEvent);
    this.networkInterceptor = new NetworkInterceptor(pushEvent);
    this.errorInterceptor = new ErrorInterceptor(pushEvent);
    this.viewportTracker = new ViewportTracker(pushEvent);
    this.pointerTracker = new PointerTracker(pushEvent);
  }

  public start(): this {
    if (this.isRunning) return this;

    if (this.config.captureConsole !== false) {
      this.consoleInterceptor.install();
    }
    if (this.config.captureNetwork !== false) {
      this.networkInterceptor.install();
    }
    if (this.config.captureErrors !== false) {
      this.errorInterceptor.install();
    }
    if (this.config.captureViewport !== false) {
      this.viewportTracker.install();
    }
    if (this.config.captureTouch !== false) {
      this.pointerTracker.install();
    }

    this.isRunning = true;
    return this;
  }

  public stop(): this {
    if (!this.isRunning) return this;

    this.consoleInterceptor.uninstall();
    this.networkInterceptor.uninstall();
    this.errorInterceptor.uninstall();
    this.viewportTracker.uninstall();
    this.pointerTracker.uninstall();

    this.isRunning = false;
    return this;
  }

  public attachEmitter(emitter: TransportEmitter): void {
    this.buffer.attachEmitter(emitter);
  }

  public detachEmitter(): void {
    this.buffer.detachEmitter();
  }

  public getBufferedEvents(): RelayTelemetryEvent[] {
    return this.buffer.toArray();
  }

  public clearBuffer(): void {
    this.buffer.clear();
  }

  public active(): boolean {
    return this.isRunning;
  }
}

// Global bootstrap instance
let globalAgent: RelayAgent | null = null;

export function initRelayAgent(config?: RelayAgentConfig): RelayAgent {
  if (!globalAgent) {
    globalAgent = new RelayAgent(config);
    globalAgent.start();
  }
  return globalAgent;
}

export function getRelayAgent(): RelayAgent | null {
  return globalAgent;
}
