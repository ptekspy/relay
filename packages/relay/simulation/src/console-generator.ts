export interface SimulatedLog {
  level: "info" | "warn" | "error";
  args: unknown[];
  stack?: string;
}

export class HighFrequencyConsoleGenerator {
  public generateBurst(count: number): SimulatedLog[] {
    const logs: SimulatedLog[] = [];
    for (let i = 0; i < count; i++) {
      if (i % 10 === 0) {
        logs.push({
          level: "error",
          args: [`Simulated runtime error #${i}`, { errorCode: 500 + (i % 5) }],
          stack: `Error: Simulated runtime error #${i}\n    at renderComponent (/src/App.tsx:42:15)\n    at commitWork (/src/react-dom.js:1200:20)`,
        });
      } else if (i % 3 === 0) {
        logs.push({
          level: "warn",
          args: [`[Warning] Deprecated feature used in loop #${i}`],
        });
      } else {
        logs.push({
          level: "info",
          args: [`[Telemetry] Heartbeat ack #${i}`],
        });
      }
    }
    return logs;
  }

  public createCircularObject(): Record<string, unknown> {
    const obj: Record<string, unknown> = {
      name: "circular-root",
      data: [1, 2, 3],
    };
    obj.self = obj;
    return obj;
  }
}

export const highFrequencyConsoleGenerator =
  new HighFrequencyConsoleGenerator();
