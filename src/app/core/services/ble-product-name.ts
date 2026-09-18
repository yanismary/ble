export function normalizeBleProductName(value: string): string {
  const terminator = value.indexOf('\0');
  const name = terminator === -1 ? value : value.slice(0, terminator);
  return name.replace(/[\u0001-\u001f\u007f]+$/, '').trim();
}
