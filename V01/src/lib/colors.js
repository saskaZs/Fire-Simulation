/*
 * Convert a particle's current state + global energy setting to an RGBA string.
 * Palette logic:
 * - low energy → warm reds/oranges
 * - mid energy → orange/yellow
 * - high energy → cyan/blue tint (blowtorch feel)
 *
 * Alpha is driven by particle.lifeFraction for a smooth fade-out.
 *
 * @param {import('./createParticle').FireParticle} particle
 * @param {number} energyPercent - [10..100] from the UI
 * @returns {string} rgba(...) CSS string
*/
export function computeParticleColorRGBA(particle, energyPercent) {
  const energyScalar01 = energyPercent / 100
  const life = particle.lifeFraction

  let r, g, b

  if (energyScalar01 > 0.7) {
    // High energy → brighter/cooler (blue-ish)
    const t = (energyScalar01 - 0.7) / 0.3 // map 0.7..1.0 → 0..1
    r = Math.floor(120 + t * 135) // 120..255
    g = Math.floor(180 + t * 75)  // 180..255
    b = Math.floor(255)           // stay high (blue channel)
  } else if (energyScalar01 > 0.4) {
    // Mid→high → yellow to orange
    const t = (energyScalar01 - 0.4) / 0.3
    r = Math.floor(255)
    g = Math.floor(220 - t * 60)  // 220..160
    b = Math.floor(30 + t * 170)  // 30..200
  } else {
    // Low → red/orange
    const t = energyScalar01 / 0.4
    r = Math.floor(220 + t * 35)  // 220..255
    g = Math.floor(40 + t * 180)  // 40..220
    b = Math.floor(10 + t * 20)   // 10..30
  }

  // Alpha scales with remaining life. Use a gentle exponent for smoother tails.
  const alpha = Math.pow(life, 0.7) * 0.9
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
