
export function createFireParticle(energyPercent, gaussian) {
  const burnerCenterX = 0
  const burnerBaseY = 0
  const energyScalar01 = energyPercent / 100

  // Horizontal spawn spread (standard deviation):
  // - low energy → wider spread ("onion-like" base)
  // - high energy → tighter jet
  const spawnSpreadUnits = 1.5 - (energyScalar01 * 1.0) // 40 → 15 across range

  // Sample X from a Gaussian around the burner center and add tiny vertical jitter.
  const spawnX = gaussian(burnerCenterX, Math.max(spawnSpreadUnits, 1e-3))
  const spawnZ = gaussian(0, Math.max(spawnSpreadUnits, 1e-3)) // Szórás a Z tengelyen is
  const spawnY = burnerBaseY + (Math.random() - 0.5) * 0.5 // Kisebb függőleges szórás

  // How far from the center did we spawn? Normalized by the chosen spread.
  const distanceFromCenterPx = Math.sqrt(Math.pow(spawnX - burnerCenterX, 2) + Math.pow(spawnZ, 2))
  const normalizedDistanceFromCenter = distanceFromCenterPx / Math.max(spawnSpreadUnits, 1e-3)

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
  const initialVelocityY = 1.5 + energyScalar01 * 4.5
  const lateralSpreadScale = (1 - energyScalar01) * 0.8
  const rareLateralKick = Math.random() < 0.08 ? (Math.random() - 0.5) * 1.2 : 0
  const initialVelocityX = (Math.random() - 0.5) * lateralSpreadScale + rareLateralKick
  const initialVelocityZ = (Math.random() - 0.5) * lateralSpreadScale + rareLateralKick

  /* @type {FireParticle} */
  return {
    positionX: spawnX,
    positionY: spawnY,
    positionZ: spawnZ,

    velocityX: initialVelocityX,
    velocityY: initialVelocityY,
    velocityZ: initialVelocityZ,

    initialEnergy,
    remainingEnergy: initialEnergy,
    lifeFraction: 1.0,
    basePixelRadius: 4 + Math.random() * 3,
    normalizedDistanceFromCenter,
    receivedBurstEnergy,
  }
}
