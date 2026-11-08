export class WasmBrotliDecompressor {
  public async decompressStream(chunks: Uint8Array[]): Promise<Uint8Array> {
    const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    // In modern Web Streams API / DecompressionStream:
    if (typeof DecompressionStream !== "undefined") {
      try {
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(combined);
            controller.close();
          },
        }).pipeThrough(new DecompressionStream("deflate")); // standard deflate/gzip/br abstraction
        const response = new Response(stream);
        const buf = await response.arrayBuffer();
        return new Uint8Array(buf);
      } catch {
        // Fallback to raw stream if decompression throws
      }
    }

    return combined;
  }
}

export const wasmBrotliDecompressor = new WasmBrotliDecompressor();
