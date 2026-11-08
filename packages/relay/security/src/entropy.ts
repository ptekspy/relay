export class EntropyEvaluator {
  public calculateShannonEntropy(text: string): number {
    if (text.length === 0) return 0;

    const frequencies = new Map<string, number>();
    for (const char of text) {
      frequencies.set(char, (frequencies.get(char) || 0) + 1);
    }

    let entropy = 0;
    const len = text.length;
    for (const count of frequencies.values()) {
      const p = count / len;
      entropy -= p * Math.log2(p);
    }

    return +entropy.toFixed(3);
  }

  public calculateBruteForceComplexity(
    length: number,
    charsetSize: number,
    rateLimitPerSec = 5,
  ): { totalCombinations: number; yearsToCrack: number } {
    const totalCombinations = charsetSize ** length;
    const secondsToCrack = totalCombinations / 2 / rateLimitPerSec; // 50% probability
    const yearsToCrack = +(secondsToCrack / (3600 * 24 * 365)).toFixed(2);

    return { totalCombinations, yearsToCrack };
  }
}

export const entropyEvaluator = new EntropyEvaluator();
