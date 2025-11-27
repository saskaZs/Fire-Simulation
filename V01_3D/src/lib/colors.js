/*
 * Kiszámítja a részecske színét az élettartama (lifeFraction) alapján.
 * A részecskék fehéren/sárgán "születnek" (forró), majd narancs/vörösre
 * hűlnek, mielőtt kialszanak.
 *
 * @param {import('./createParticle').FireParticle} particle
 * @returns {{r: number, g: number, b: number}} - 0..1 közötti értékek
*/
export function computeParticleColor(particle) {
  const life = particle.lifeFraction // 1.0 (friss) -> 0.0 (halott)

  let r, g, b

  if (life > 0.9) {
    // 1. Forró mag (Fehér -> Világossárga)
    const t = (life - 0.9) / 0.1 // 0..1
    r = 1.0
    g = 0.8 + t * 0.2 // 0.8 -> 1.0
    b = 0.5 + t * 0.5 // 0.5 -> 1.0
  } else if (life > 0.6) {
    // 2. Fő lángtest (Világossárga -> Narancs)
    const t = (life - 0.6) / 0.3 // 0..1
    r = 1.0
    g = 0.5 + t * 0.3 // 0.5 -> 0.8
    b = 0.0 + t * 0.5 // 0.0 -> 0.5
  } else if (life > 0.25) {
    // 3. Hűlő parázs (Narancs -> Vörös)
    const t = (life - 0.25) / 0.35 // 0..1
    r = 0.9 + t * 0.1 // 0.9 -> 1.0
    g = 0.2 + t * 0.3 // 0.2 -> 0.5
    b = 0.0
  } else {
    // 4. Kialvás (Vörös -> Sötétvörös)
    const t = life / 0.25 // 0..1
    r = 0.4 + t * 0.5 // 0.4 -> 0.9
    g = 0.1 + t * 0.1 // 0.1 -> 0.2
    b = 0.0
  }

  // Az össz-fényerőt is az élettartam vezérli (parabolikus fade)
  // Így a közepe fényesebb, a széle és a teteje halványabb.
  const fade = Math.sin(Math.PI * (1.0 - life)) * 0.5 + Math.pow(life, 2.0) * 0.5
  const brightness = Math.max(0, Math.min(1, fade * 1.5))

  return {
    r: r * brightness,
    g: g * brightness,
    b: b * brightness,
  }
}