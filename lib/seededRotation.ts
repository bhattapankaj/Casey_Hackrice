/** Persistent tilt in degrees, in the range [-3, 3], derived from a card id. */
export function seededRotation(id: string): number {
  let hash = 0;

  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) >>> 0;
  }

  const steps = hash % 601;
  return Math.round((steps / 100 - 3) * 100) / 100;
}
