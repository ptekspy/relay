export class WasmMemoryRingBuffer {
  private memory: ArrayBuffer;
  private view: Uint8Array;
  private writePointer = 0;
  private readonly capacity: number;

  constructor(capacityBytes = 64 * 1024) {
    this.capacity = capacityBytes;
    this.memory = new ArrayBuffer(capacityBytes);
    this.view = new Uint8Array(this.memory);
  }

  public allocateSlot(size: number): { offset: number; length: number } {
    if (size > this.capacity) {
      throw new Error(
        `Requested allocation ${size} bytes exceeds ring buffer capacity ${this.capacity}`,
      );
    }

    // Wrap around if insufficient remaining continuous space
    if (this.writePointer + size > this.capacity) {
      this.writePointer = 0;
    }

    const offset = this.writePointer;
    this.writePointer += size;
    return { offset, length: size };
  }

  public writeSlice(offset: number, data: Uint8Array): void {
    this.view.set(data, offset);
  }

  public readSlice(offset: number, length: number): Uint8Array {
    return this.view.subarray(offset, offset + length);
  }

  public reset(): void {
    this.writePointer = 0;
    this.view.fill(0);
  }

  public getCapacity(): number {
    return this.capacity;
  }
}

export const wasmMemoryRingBuffer = new WasmMemoryRingBuffer();
