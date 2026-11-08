import type { ProtocolSpecMessage } from "./types.js";

export class RelaySpecExplorer {
  private static readonly MESSAGES: ProtocolSpecMessage[] = [
    {
      code: 0x01,
      name: "ClientHello",
      category: "handshake",
      description:
        "Initiates WebSocket session handshake from receiver to Relay gateway.",
      fields: [
        {
          name: "protocolVersion",
          type: "uint8",
          description: "Relay binary protocol version (currently 1)",
        },
        {
          name: "deviceId",
          type: "string",
          description: "Unique UUIDv4 identifying client receiver",
        },
        {
          name: "capabilities",
          type: "uint32",
          description: "Bitmask of receiver capabilities (touch, console, dom)",
        },
      ],
    },
    {
      code: 0x02,
      name: "ServerHello",
      category: "handshake",
      description:
        "Gateway response confirming session assignment and cryptographic challenge.",
      fields: [
        {
          name: "sessionId",
          type: "string",
          description: "Assigned active session ID",
        },
        {
          name: "heartbeatIntervalMs",
          type: "uint16",
          description: "Negotiated ping interval in milliseconds",
        },
      ],
    },
    {
      code: 0x10,
      name: "DomMutationBatch",
      category: "telemetry",
      description:
        "Compressed stream of DOM tree mutations emitted by host application.",
      fields: [
        {
          name: "sequenceNumber",
          type: "uint32",
          description: "Monotonically increasing batch sequence counter",
        },
        {
          name: "mutationsCount",
          type: "uint16",
          description: "Number of records in payload",
        },
        {
          name: "compressedPayload",
          type: "bytes",
          description: "Zstd-compressed binary mutation records",
        },
      ],
    },
    {
      code: 0x20,
      name: "ConsoleLogEntry",
      category: "telemetry",
      description: "Interception record for console.log/warn/error dispatches.",
      fields: [
        {
          name: "level",
          type: "uint8",
          description: "Log severity (0=debug, 1=info, 2=warn, 3=error)",
        },
        {
          name: "timestamp",
          type: "uint64",
          description: "Epoch millisecond timestamp",
        },
        {
          name: "args",
          type: "string[]",
          description: "Serialized argument array",
        },
      ],
    },
    {
      code: 0x30,
      name: "SessionError",
      category: "error",
      description:
        "Gateway or peer error notification triggering graceful degradation.",
      fields: [
        {
          name: "errorCode",
          type: "string",
          description: "Machine-readable error identifier",
        },
        {
          name: "message",
          type: "string",
          description: "Human-readable description",
        },
      ],
    },
  ];

  public listMessages(): ProtocolSpecMessage[] {
    return RelaySpecExplorer.MESSAGES;
  }

  public getMessageByCode(code: number): ProtocolSpecMessage | undefined {
    return RelaySpecExplorer.MESSAGES.find((m) => m.code === code);
  }

  public getMessagesByCategory(
    category: ProtocolSpecMessage["category"],
  ): ProtocolSpecMessage[] {
    return RelaySpecExplorer.MESSAGES.filter((m) => m.category === category);
  }
}

export const relaySpecExplorer = new RelaySpecExplorer();
