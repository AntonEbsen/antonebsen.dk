/**
 * Turns a string into a stable number, for the procedural ornaments.
 *
 * ContourField and TerrainRule draw from a seed. Deriving that seed from
 * something the page already has — its title, its slug — means every page grows
 * a different hill without anyone choosing one, and the same page grows the same
 * hill on every build. No RNG, so server and client agree and the markup is
 * stable in the visual-regression snapshots.
 */

/** FNV-1a. Small, well distributed for short strings, and no dependencies. */
export function hashString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * A seed in [0, 2π), which is the range the contour maths wants — it feeds
 * straight into the sin/cos wobble as a phase offset.
 */
export function seedFrom(input: string): number {
  return (hashString(input) % 10000) / 10000 * Math.PI * 2;
}
