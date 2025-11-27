/*
 * @typedef FireParticle
 * @property {number} positionX                    - current x position in pixels
 * @property {number} positionY                    - current y position in pixels
 * @property {number} velocityX                    - horizontal velocity in px/frame
 * @property {number} velocityY                    - vertical velocity in px/frame (negative goes up)
 * @property {number} initialEnergy                - starting energy units
 * @property {number} remainingEnergy              - current energy units
 * @property {number} lifeFraction                 - remainingEnergy / initialEnergy in [0..1]
 * @property {number} basePixelRadius              - baseline pixel radius for drawing
 * @property {number} normalizedDistanceFromCenter - |x-center| / spawnSpread (≈ 0 center .. 1+ edge)
 * @property {boolean} receivedBurstEnergy         - true if this particle got an extra energy burst
*/

/*
 * Spawn a single fire particle around the burner base using a Gaussian spread.
 * Centered particles get more energy and lift; edge particles get less (but sometimes a "burst").
 *
 * @param {number} canvasWidthPx
 * @param {number} canvasHeightPx
 * @param {number} energyPercent - [10..100]
 * @param {(mean:number, stdDev:number) => number} gaussian - RNG function for normal sampling
 * @returns {FireParticle}
*/

export function createFireParticle(canvasWidthPx, canvasHeightPx, energyPercent, gaussian) {
  const burnerCenterX = canvasWidthPx / 2
  const burnerBaseY = canvasHeightPx - 20
  const energyScalar01 = energyPercent / 100

  // Horizontal spawn spread (standard deviation):
  // - low energy → wider spread ("onion-like" base)
  // - high energy → tighter jet
  const spawnSpreadPixels = 40 - (energyScalar01 * 25) // 40 → 15 across range

  // Sample X from a Gaussian around the burner center and add tiny vertical jitter.
  const spawnX = gaussian(burnerCenterX, Math.max(spawnSpreadPixels, 1e-3))
  const spawnY = burnerBaseY + (Math.random() - 0.5) * 5

  // How far from the center did we spawn? Normalized by the chosen spread.
  const distanceFromCenterPx = Math.abs(spawnX - burnerCenterX)
  const normalizedDistanceFromCenter = distanceFromCenterPx / Math.max(spawnSpreadPixels, 1e-3)

  // Rare "burst" so some edge particles may still get propelled (adds lively filaments).
  const burstEnergyBonus = Math.random() < 0.15 ? (0.3 + Math.random() * 0.4) : 0
  const receivedBurstEnergy = burstEnergyBonus > 0

  // Center-bias: closer to center → more energy. Edges get less unless they received a burst.
  const centerEnergyBias = Math.max(0, 1 - normalizedDistanceFromCenter * 0.4 + burstEnergyBonus)

  // Base energy scaled by global slider; we add variation to avoid uniform behavior.
  const baseEnergyUnits = 40 + energyScalar01 * 90
  const particleEnergyUnits = baseEnergyUnits * centerEnergyBias
  const randomEnergyVariation = 0.7 + Math.random() * 0.6 // 70%..130%
  const initialEnergy = particleEnergyUnits * randomEnergyVariation

  // Initial velocity:
  // - upward velocity is stronger at higher energy
  // - lateral velocity is stronger at lower energy (wider “onionish” shape)
  const initialVelocityY = -1.5 - energyScalar01 * 4.5
  const lateralSpreadScale = (1 - energyScalar01) * 0.8
  const rareLateralKick = Math.random() < 0.08 ? (Math.random() - 0.5) * 1.2 : 0
  const initialVelocityX = (Math.random() - 0.5) * lateralSpreadScale + rareLateralKick

  /* @type {FireParticle} */
  return {
    positionX: spawnX,
    positionY: spawnY,
    velocityX: initialVelocityX,
    velocityY: initialVelocityY,
    initialEnergy,
    remainingEnergy: initialEnergy,
    lifeFraction: 1.0,
    basePixelRadius: 4 + Math.random() * 3,
    normalizedDistanceFromCenter,
    receivedBurstEnergy,
  }
}
