export function extractJson(text: string) {
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first === -1 || last === -1) {
    throw new Error('No JSON object found in model output');
  }
  return JSON.parse(text.slice(first, last + 1));
}