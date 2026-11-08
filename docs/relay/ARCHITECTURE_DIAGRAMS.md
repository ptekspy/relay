# Paddy Systems Relay — Architectural Concept Diagrams

Visual system diagrams illustrating the runtime topologies, message lifecycles, and security boundaries of Paddy Systems Relay.

---

## 1. Local LAN Direct Pairing Sequence

Demonstrates the zero-cloud, direct local area network handshake between the developer host terminal and mobile receiver device.

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer (Host)
    participant CLI as Relay CLI (Ink / Port 7331)
    participant App as Target Dev Server (e.g. Next.js :3000)
    actor Phone as Mobile Device (Receiver)

    Dev->>CLI: relay 3000
    CLI->>App: TCP Probe (Check port 3000 reachable)
    App-->>CLI: Connection accepted
    CLI->>CLI: Discover LAN IP & Generate 32-byte Token + QR Code
    CLI-->>Dev: Display ASCII QR Code & Short Code
    Phone->>CLI: Scans QR / GET http://192.168.1.45:7331/?token=...
    CLI-->>Phone: Serve Receiver Web App (HTML/JS)
    Phone->>CLI: WebSocket Upgrade (ws://192.168.1.45:7331/ws?token=...)
    CLI->>CLI: Verify Timing-Safe Token
    CLI-->>Phone: WS Connected (Handshake ACK)
    Phone->>CLI: Capability Announcement (DOM, Console, Touch)
    CLI-->>Dev: Update Terminal UI ("1 Receiver Connected")
    
    loop Live Bidirectional Telemetry
        Phone->>CLI: Telemetry Events (Console, TTFB, Errors)
        CLI->>App: Transparent Proxy Forwarding
        App-->>CLI: Upstream Responses & HMR Websocket
        CLI-->>Phone: Stream Assets & HMR Patches
    end
```

---

## 2. Remote Edge Tunnel Topology

Demonstrates the multi-region edge tunneling architecture for disparate network collaboration.

```mermaid
flowchart TD
    subgraph Host_Machine ["Developer Machine (Behind NAT / Firewall)"]
        DevServer["Local Dev Server (:3000)"]
        HostCLI["Relay CLI Client"]
        DevServer <-->|HTTP / HMR| HostCLI
    end

    subgraph Edge_Cloud ["Paddy Systems Global Edge Network"]
        EdgeAnycast["Anycast Edge Ingress (Cloudflare / Fastly)"]
        SignalingCluster["Signaling & Router Gateway (WSS)"]
        SessionRegistry[("Session State & Token Store")]
        
        EdgeAnycast <--> SignalingCluster
        SignalingCluster <--> SessionRegistry
    end

    subgraph Remote_Client ["Remote Collaborator / Client"]
        RemoteBrowser["Browser / Phone Receiver"]
    end

    HostCLI -->|"Outbound WSS Tunnel (Port 443)"| SignalingCluster
    RemoteBrowser -->|"HTTPS / WSS (tenant.relay.paddy.systems)"| EdgeAnycast
    SignalingCluster <-->|"End-to-End Encrypted Frames"| RemoteBrowser
```

---

## 3. Client-Side Telemetry Pipeline

Demonstrates telemetry interception, buffering, PII sanitization, and dispatch inside the browser.

```mermaid
flowchart LR
    subgraph Client_Browser ["Target Browser Runtime"]
        AppCode["User Application Code"]
        
        subgraph Interceptors ["Relay Agent Interceptors"]
            ConsoleHook["Console Interceptor"]
            NetHook["Fetch / XHR Interceptor"]
            ErrorHook["Window Error Interceptor"]
            TouchHook["Pointer / Touch Tracker"]
        end

        subgraph Security_Filter ["Safety & Redaction Engine"]
            Redactor["PII & Secret Redaction (Bearer, Passwords, CC)"]
            CircularSafe["Circular Reference Serializer"]
        end

        RingBuffer[("Ring Buffer (200 frames)")]
        Transport["WebSocket Dispatcher"]
    end

    subgraph Host_Gateway ["Relay LAN Gateway (:7331)"]
        ReceiverSink["Telemetry Ingestor & DevTools UI"]
    end

    AppCode -->|console.log| ConsoleHook
    AppCode -->|window.fetch| NetHook
    AppCode -->|throw Error| ErrorHook
    AppCode -->|pointerdown| TouchHook

    ConsoleHook --> CircularSafe
    NetHook --> Redactor
    ErrorHook --> CircularSafe
    TouchHook --> CircularSafe

    CircularSafe --> RingBuffer
    Redactor --> RingBuffer
    RingBuffer --> Transport
    Transport -->|ws://host:7331/ws| ReceiverSink
```
