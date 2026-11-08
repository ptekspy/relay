/**
 * @paddy-systems/relay-python
 * Python & Django Ecosystem SDK.
 */

export * from "./celery_tracer.js";
export * from "./django_middleware.js";
export * from "./fastapi_middleware.js";
export * from "./flask_middleware.js";
export * from "./logging_handler.js";
export * from "./orm_profiler.js";
export * from "./pytest_plugin.js";
export * from "./reloader_hook.js";
export * from "./types.js";

import { CeleryTaskTracer } from "./celery_tracer.js";
import { DjangoHtmlInjector } from "./django_middleware.js";
import { FastApiTraceMiddleware } from "./fastapi_middleware.js";
import { FlaskRelayExtension } from "./flask_middleware.js";
import { PythonLoggingBridge } from "./logging_handler.js";
import { OrmQueryProfiler } from "./orm_profiler.js";
import { PytestRelayFixtureManager } from "./pytest_plugin.js";
import { PythonReloaderNotifier } from "./reloader_hook.js";

export class RelayPythonSdkCoordinator {
  public django = DjangoHtmlInjector;
  public fastapi = new FastApiTraceMiddleware();
  public flask = new FlaskRelayExtension();
  public logging = PythonLoggingBridge;
  public orm = new OrmQueryProfiler();
  public celery = new CeleryTaskTracer();
  public pytest = PytestRelayFixtureManager;
  public reloader = new PythonReloaderNotifier();
}
