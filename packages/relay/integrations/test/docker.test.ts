import { describe, expect, it } from "bun:test";
import { DockerPortDetector } from "../src/docker.js";

describe("TASK-127: Docker Container & Port Mapping Auto-Detector", () => {
  it("parses Docker port mappings from inspect payload", () => {
    const rawPortMap = {
      "3000/tcp": [
        { HostIp: "0.0.0.0", HostPort: "8080" },
        { HostIp: "::", HostPort: "8080" },
      ],
      "5173/tcp": [{ HostIp: "127.0.0.1", HostPort: "5173" }],
      "80/tcp": null,
    };

    const bindings = DockerPortDetector.parsePortBindings(rawPortMap);
    expect(bindings.length).toBe(3);

    expect(bindings[0]?.containerPort).toBe(3000);
    expect(bindings[0]?.hostPort).toBe(8080);
    expect(bindings[2]?.containerPort).toBe(5173);
    expect(bindings[2]?.hostPort).toBe(5173);
  });

  it("resolves container target port to exposed host port accurately", () => {
    const bindings = [
      { containerPort: 3000, hostPort: 8080, hostIp: "0.0.0.0" },
      { containerPort: 5432, hostPort: 54320, hostIp: "127.0.0.1" },
    ];

    expect(DockerPortDetector.resolveHostPort(3000, bindings)).toBe(8080);
    expect(DockerPortDetector.resolveHostPort(5432, bindings)).toBe(54320);
    // Unmapped port returns original
    expect(DockerPortDetector.resolveHostPort(4000, bindings)).toBe(4000);
  });

  it("resolves reachable host LAN IP for physical mobile receivers", () => {
    const hostIp = DockerPortDetector.resolveReachableHostIp(
      true,
      "192.168.1.150",
    );
    expect(hostIp).toBe("192.168.1.150");

    const localIp = DockerPortDetector.resolveReachableHostIp(
      false,
      "192.168.1.150",
    );
    expect(localIp).toBe("192.168.1.150");
  });
});
