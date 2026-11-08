export class PythonReloaderNotifier {
  private reloadCount = 0;
  private listeners = new Set<
    (event: { modifiedFile: string; count: number }) => void
  >();

  public onFileModified(modifiedFile: string): void {
    this.reloadCount++;
    const payload = { modifiedFile, count: this.reloadCount };
    for (const cb of this.listeners) {
      cb(payload);
    }
  }

  public getReloadCount(): number {
    return this.reloadCount;
  }

  public subscribe(
    cb: (event: { modifiedFile: string; count: number }) => void,
  ): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }
}
