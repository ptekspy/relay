import type { ConsoleLogLevel } from "@paddy-systems/relay-protocol";

export interface PythonLogRecord {
  name: string;
  level: "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  message: string;
  pathname: string;
  lineno: number;
  excText?: string;
}

export class PythonLoggingBridge {
  public static mapLevel(pyLevel: PythonLogRecord["level"]): ConsoleLogLevel {
    switch (pyLevel) {
      case "DEBUG":
        return "debug";
      case "INFO":
        return "info";
      case "WARNING":
        return "warn";
      case "ERROR":
      case "CRITICAL":
        return "error";
    }
  }

  public static formatConsoleArgs(record: PythonLogRecord): unknown[] {
    const prefix = `[Python:${record.name}]`;
    if (record.excText) {
      return [prefix, record.message, record.excText];
    }
    return [prefix, record.message];
  }
}
