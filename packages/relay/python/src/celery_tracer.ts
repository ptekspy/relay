import type { CeleryTaskTrace } from "./types.js";

export class CeleryTaskTracer {
  private tasks = new Map<string, CeleryTaskTrace>();

  public onTaskStarted(
    taskId: string,
    taskName: string,
    args?: unknown[],
  ): void {
    this.tasks.set(taskId, {
      taskId,
      taskName,
      status: "STARTED",
      args,
    });
  }

  public onTaskSuccess(taskId: string, durationMs: number): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = "SUCCESS";
      task.durationMs = durationMs;
    }
  }

  public onTaskFailure(
    taskId: string,
    error: string,
    durationMs: number,
  ): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = "FAILURE";
      task.error = error;
      task.durationMs = durationMs;
    }
  }

  public getTask(taskId: string): CeleryTaskTrace | undefined {
    return this.tasks.get(taskId);
  }

  public getActiveTasks(): CeleryTaskTrace[] {
    return Array.from(this.tasks.values()).filter(
      (t) => t.status === "STARTED",
    );
  }
}
