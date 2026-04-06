/**
 * Shared token-vector and cosine-similarity helpers used by both
 * `run_reality_scanner` and `analyze_legacy_modules`.
 */

export function tokenizeSemanticText(value: string): string[] {
  const normalized = value.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase();
  return normalized.match(/[\p{L}\p{N}_]+/gu)?.filter((token) => token.length > 1) ?? [];
}

export function buildTokenVector(value: string): Map<string, number> {
  const vector = new Map<string, number>();
  for (const token of tokenizeSemanticText(value)) {
    vector.set(token, (vector.get(token) ?? 0) + 1);
  }
  return vector;
}

export function cosineSimilarity(left: Map<string, number>, right: Map<string, number>): number {
  if (left.size === 0 || right.size === 0) {
    return 0;
  }

  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;

  for (const value of left.values()) {
    leftNorm += value * value;
  }
  for (const value of right.values()) {
    rightNorm += value * value;
  }

  const [smaller, larger] = left.size <= right.size ? [left, right] : [right, left];
  for (const [token, value] of smaller.entries()) {
    dot += value * (larger.get(token) ?? 0);
  }

  if (leftNorm === 0 || rightNorm === 0) {
    return 0;
  }

  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}
