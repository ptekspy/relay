import { describe, expect, test } from "bun:test";
import {
  CeleryTaskTracer,
  DjangoHtmlInjector,
  FastApiTraceMiddleware,
  FlaskRelayExtension,
  OrmQueryProfiler,
  PytestRelayFixtureManager,
  PythonLoggingBridge,
  PythonReloaderNotifier,
  RelayPythonSdkCoordinator,
} from "../src/index.js";

describe("Relay Python & Django SDK Integration Tests", () => {
  test("Django injector embeds agent tag before closing body tag", () => {
    const html = "<html><body><h1>Hello World</h1></body></html>";
    const injected = DjangoHtmlInjector.injectAgentScript(html);

    expect(injected).toContain(
      '<script src="http://localhost:7331/relay/agent.js"',
    );
    expect(injected).toContain("data-relay-injected");
    expect(injected.indexOf("<script")).toBeLessThan(
      injected.indexOf("</body>"),
    );
  });

  test("Django injector skips redirect and JSON responses", () => {
    expect(DjangoHtmlInjector.shouldInject("application/json", 200)).toBe(
      false,
    );
    expect(DjangoHtmlInjector.shouldInject("text/html", 302)).toBe(false);
    expect(
      DjangoHtmlInjector.shouldInject("text/html; charset=utf-8", 200),
    ).toBe(true);
  });

  test("FastAPI trace middleware aggregates latency metrics", () => {
    const middleware = new FastApiTraceMiddleware();
    middleware.recordRequest({
      framework: "fastapi",
      method: "GET",
      path: "/items/1",
      statusCode: 200,
      durationMs: 40,
    });
    middleware.recordRequest({
      framework: "fastapi",
      method: "POST",
      path: "/items",
      statusCode: 201,
      durationMs: 60,
    });

    expect(middleware.getRecentTraces().length).toBe(2);
    expect(middleware.calculateAverageLatency()).toBe(50);
  });

  test("Flask extension initializes configuration", () => {
    const ext = new FlaskRelayExtension({
      gatewayUrl: "http://127.0.0.1:9000",
    });
    expect(ext.isReady()).toBe(false);

    ext.initApp({ name: "my_flask_app", debug: true });
    expect(ext.isReady()).toBe(true);
    expect(ext.getConfig().gatewayUrl).toBe("http://127.0.0.1:9000");
  });

  test("Python logging bridge converts records to console events", () => {
    expect(PythonLoggingBridge.mapLevel("DEBUG")).toBe("debug");
    expect(PythonLoggingBridge.mapLevel("INFO")).toBe("info");
    expect(PythonLoggingBridge.mapLevel("WARNING")).toBe("warn");
    expect(PythonLoggingBridge.mapLevel("ERROR")).toBe("error");

    const formatted = PythonLoggingBridge.formatConsoleArgs({
      name: "views.auth",
      level: "ERROR",
      message: "Database connection refused",
      pathname: "views/auth.py",
      lineno: 42,
      excText: "OperationalError: connection timed out",
    });

    expect(formatted[0]).toBe("[Python:views.auth]");
    expect(formatted[1]).toBe("Database connection refused");
    expect(formatted[2]).toContain("OperationalError");
  });

  test("ORM query profiler tracks slow queries and N+1 patterns", () => {
    const profiler = new OrmQueryProfiler(30);

    // Add normal query
    profiler.recordQuery({
      query: "SELECT id FROM users WHERE id = 1",
      durationMs: 5,
      engine: "postgres",
      timestamp: 1000,
    });

    // Add slow query
    profiler.recordQuery({
      query: "SELECT * FROM analytics",
      durationMs: 75,
      engine: "postgres",
      timestamp: 1100,
    });

    expect(profiler.getSlowQueries().length).toBe(1);

    // Simulate N+1 pattern
    profiler.recordQuery({
      query: "SELECT * FROM profile WHERE user_id = 1",
      durationMs: 2,
      engine: "postgres",
      timestamp: 1200,
    });
    profiler.recordQuery({
      query: "SELECT * FROM profile WHERE user_id = 2",
      durationMs: 2,
      engine: "postgres",
      timestamp: 1205,
    });
    profiler.recordQuery({
      query: "SELECT * FROM profile WHERE user_id = 3",
      durationMs: 2,
      engine: "postgres",
      timestamp: 1210,
    });

    const nPlusOne = profiler.detectPotentialNPlusOne();
    expect(nPlusOne.count).toBeGreaterThanOrEqual(3);
    expect(nPlusOne.samplePattern).toBeDefined();
  });

  test("Celery task tracer tracks execution lifecycle", () => {
    const tracer = new CeleryTaskTracer();
    tracer.onTaskStarted("task-123", "send_welcome_email", [
      "user@example.com",
    ]);

    expect(tracer.getActiveTasks().length).toBe(1);

    tracer.onTaskSuccess("task-123", 145);
    const task = tracer.getTask("task-123");
    expect(task?.status).toBe("SUCCESS");
    expect(task?.durationMs).toBe(145);
    expect(tracer.getActiveTasks().length).toBe(0);
  });

  test("Pytest fixture manager generates configs and code snippet", () => {
    const cfg = PytestRelayFixtureManager.getDeviceConfig("iphone-15");
    expect(cfg.viewportWidth).toBe(393);
    expect(cfg.orientation).toBe("portrait");

    const snippet = PytestRelayFixtureManager.generatePytestSnippet();
    expect(snippet).toContain("relay_receiver");
  });

  test("Reloader notifier fires events on modified files", () => {
    const notifier = new PythonReloaderNotifier();
    let receivedFile = "";

    const unsub = notifier.subscribe((evt) => {
      receivedFile = evt.modifiedFile;
    });

    notifier.onFileModified("views/home.py");
    expect(receivedFile).toBe("views/home.py");
    expect(notifier.getReloadCount()).toBe(1);

    unsub();
  });

  test("RelayPythonSdkCoordinator facade", () => {
    const coord = new RelayPythonSdkCoordinator();
    expect(coord.django).toBeDefined();
    expect(coord.fastapi).toBeDefined();
    expect(coord.flask).toBeDefined();
    expect(coord.celery).toBeDefined();
  });
});
