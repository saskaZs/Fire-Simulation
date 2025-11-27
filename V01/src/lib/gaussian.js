/*
 * Sample a Gaussian/normal distributed value using the Box–Muller transform.
 * Box-Muller has to random numbers and makes them to be sorted in the gaussian way
 *
 * @param {number} mean    - output mean, the distributions average
 * @param {number} stdDev  - output standard deviation
 * @returns {number}       - normally distributed sample
 */
export function gaussianRandom(mean, stdDev) {
  // Clamp u1 to avoid log(0) if Math.random() returns 0.
  const u1 = Math.max(Math.random(), 1e-12)
  const u2 = Math.random()
  // z0 ~ N(0,1)
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2)
  return z0 * stdDev + mean
}
