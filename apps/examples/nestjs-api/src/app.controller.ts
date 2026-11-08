import { Controller, Get, Post } from "@nestjs/common";

@Controller()
export class AppController {
  @Get()
  getHello() {
    return { status: "ok", framework: "nestjs" };
  }

  @Get("health")
  getHealth() {
    return { status: "healthy", service: "nestjs-microservice" };
  }

  @Post("api/test-echo")
  postEcho() {
    return { echoed: true };
  }

  @Get("api/modules")
  getModules() {
    return {
      modules: ["AuthModule", "UsersModule", "TelemetryModule"],
    };
  }
}
