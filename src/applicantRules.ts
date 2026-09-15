// Mirrors the API's fixed age boundary; the server validates it independently.
export function isSenior(age: number): boolean {
  return age > 65;
}
