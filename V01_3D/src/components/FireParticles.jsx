import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { gaussianRandom } from '../lib/gaussian'

// --- Constants ---

// Maximum number of particles in the simulation
const MAX_PARTICLES = 6000
// Base texture for the particles (a soft dot)
const particleTexture = createParticleTexture()

// --- Helper Functions ---

/**
 * Creates a soft, radial gradient texture for the particles.
 * This is much better than a hard square.
 */
function createParticleTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  gradient.addColorStop(0.0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.5, 'rgba(255,255,255,0.8)')
  gradient.addColorStop(1.0, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(canvas)
}

/*
 * Spawns a new particle object.
 * This is where the Gaussian distribution is used, as requested.
 * @param {number} energyScalar - 0.1 to 1.0
 * @returns {object} A new particle
 */
function spawnParticle(energyScalar) {
  const rampedScalar = Math.pow(energyScalar, 2.0);

  // 1. Position (Gaussian Distribution)
  // High energy = tight jet, Low energy = wider, flickering base
  const spawnRadius = 1.5 - energyScalar * 1.2;
  const posX = gaussianRandom(0, spawnRadius * 0.5); // e.g., 0.3 (high) to 1.38 (low)
  const posZ = gaussianRandom(0, spawnRadius * 0.5)
  const posY = gaussianRandom(0, 0.2)
  const pos = new THREE.Vector3(posX, posY, posZ)

  // 2. Velocity
  // High energy = strong upward velocity
  const upwardVelocity = 2.0 + rampedScalar * 10.0;
  const vel = new THREE.Vector3(
    gaussianRandom(0, 0.5), // X/Z velocity for some spread
    upwardVelocity,
    gaussianRandom(0, 0.5)
  )

  // 3. Lifetime
  // Particles at the center (Gaussian) live longer
  // High energy particles live longer overall
  const distFromCenter = Math.sqrt(posX * posX + posZ * posZ) / spawnRadius
  const centerBias = Math.max(0, 1.0 - distFromCenter * 0.5) // 1.0 at center, 0.5 at edge
  const baseLife = 1.0 + rampedScalar * 2.5; // 10% energy = 1.025s, 100% energy = 3.5s
  const life = baseLife * centerBias * (0.8 + Math.random() * 0.4);

  return {
    position: pos,
    velocity: vel,
    life: life,
    initialLife: life,
    color: new THREE.Color(),
  }
}

/*
 * Updates the color of a particle based on its life and the global energy.
 * @param {THREE.Color} color - The color object to update
 * @param {number} lifeFraction - 0.0 (dead) to 1.0 (alive)
 * @param {number} energyScalar - 0.1 to 1.0
 */
function updateParticleColor(color, lifeFraction, energyScalar) {
  // 1. Base Color (Life-based)
  // Fades from White -> Yellow -> Orange -> Red -> Dark
  let r, g, b
  if (lifeFraction > 0.9) {
    const t = (lifeFraction - 0.9) / 0.1
    r = 1.0
    g = 1.0
    b = 1.0 - (1.0 - 0.8) * t // White to bright yellow
  } else if (lifeFraction > 0.7) {
    const t = (lifeFraction - 0.7) / 0.2
    r = 1.0
    g = 1.0 - (1.0 - 0.6) * t // Bright yellow to orange
    b = 0.8 - 0.8 * t
  } else if (lifeFraction > 0.4) {
    const t = (lifeFraction - 0.4) / 0.3
    r = 1.0
    g = 0.6 - 0.4 * t // Orange to red
    b = 0.0
  } else {
    const t = lifeFraction / 0.4
    r = 1.0 - (1.0 - 0.5) * t // Red to dark red/black
    g = 0.2 * t
    b = 0.0
  }

  // 2. Energy Influence
  // High energy makes the fire "hotter" (bluer/whiter)
  // We add this on top of the base color
  const rampedScalar = Math.pow(energyScalar, 1.5);
  const hotness = rampedScalar * 1.5 * lifeFraction;
  r = Math.min(1.0, r + hotness * 0.2);
  g = Math.min(1.0, g + hotness * 0.2);
  b = Math.min(1.0, b + hotness * 1.0); // Add blue for "hot" effect

  // 3. Final Brightness (fades out)
const lifeBrightness = Math.pow(lifeFraction, 0.5)

  // This is the new scalar:
  // At 100% energy (1.0), this is 1.0.
  // At 10% energy (0.1), this is 0.3 + (0.03 * 0.7) = ~0.32
  // This makes the entire particle output much dimmer at low energy.
  const energyBrightness = 0.3 + Math.pow(energyScalar, 1.5) * 0.7

  const finalBrightness = lifeBrightness * energyBrightness
  color.setRGB(r * finalBrightness, g * finalBrightness, b * finalBrightness)
}

// --- React Component ---

/**
 * This component manages the entire particle system logic.
 */
export default function FireParticles({ energyPercent }) {
  // Refs for the 3D objects
  const pointsRef = useRef()
  const geometryRef = useRef()

  // Ref to store our list of live particle objects (JS array)
  const liveParticlesRef = useRef([])

  // Create the buffers one time with useMemo
  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(MAX_PARTICLES * 3)
    const colors = new Float32Array(MAX_PARTICLES * 3)
    return [positions, colors]
  }, [])

  // The main animation loop (runs every frame)
  useFrame((state, delta) => {
    // Safety check in case refs aren't ready
    if (!pointsRef.current || !geometryRef.current) return

    const energyScalar = energyPercent / 100.0;
    const rampedScalar = Math.pow(energyScalar, 2.0); // The same ramp as in spawn
    const liveParticles = liveParticlesRef.current;
    
    // --- 1. Spawn new particles ---
    const spawnRate = 10 + Math.floor(rampedScalar * 200);
    const particleCap = 500 + Math.floor(rampedScalar * 5500);

    for (let i = 0; i < spawnRate; i++) {
      if (liveParticles.length < particleCap && liveParticles.length < MAX_PARTICLES) {
        liveParticles.push(spawnParticle(energyScalar))
      }
    }

    // --- 2. Update and filter live particles ---
    let particleIndex = 0
    liveParticlesRef.current = liveParticles.filter((p) => {
      // a. Update lifetime
      p.life -= delta
      if (p.life <= 0) return false // This particle is dead

      // b. Apply Physics
      // Buoyancy (updraft)
      p.velocity.y += (0.02 + rampedScalar * 0.1) * delta * 60;
      
      // Turbulence (wind noise)
      const noise = (Math.sin(p.position.y * 0.5 + state.clock.elapsedTime) + Math.cos(p.position.x * 0.5 + state.clock.elapsedTime)) * 0.4;
      p.velocity.x += noise * (1.0 - energyScalar) * delta * 2; // Keep energyScalar
      p.velocity.z += noise * (1.0 - energyScalar) * delta * 2;

      // Air drag (stronger at high energy)
      p.velocity.multiplyScalar(1.0 - (0.3 + energyScalar * 0.4) * delta);
      
      // Update position
      p.position.addScaledVector(p.velocity, delta)

      // c. Update Color
      const lifeFraction = Math.max(0, p.life / p.initialLife)
      updateParticleColor(p.color, lifeFraction, energyScalar)

      // d. Write data to buffers
      positions[particleIndex * 3] = p.position.x
      positions[particleIndex * 3 + 1] = p.position.y
      positions[particleIndex * 3 + 2] = p.position.z
      
      colors[particleIndex * 3] = p.color.r
      colors[particleIndex * 3 + 1] = p.color.g
      colors[particleIndex * 3 + 2] = p.color.b

      particleIndex++
      return true // Keep this particle alive
    })

    // --- 3. Update Three.js geometry ---
    const geometry = geometryRef.current
    // Update the buffers
    geometry.attributes.position.needsUpdate = true
    geometry.attributes.color.needsUpdate = true
    // Update the "draw range" to only draw live particles
    geometry.setDrawRange(0, particleIndex)
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry ref={geometryRef}>
        {/* Position buffer */}
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={MAX_PARTICLES}
          itemSize={3}
        />
        {/* Color buffer */}
        <bufferAttribute
          attach="attributes-color"
          array={colors}
          count={MAX_PARTICLES}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        map={particleTexture}
        size={15.0}              // Particle size in pixels
        sizeAttenuation={false}  // Size is in pixels, not world units
        vertexColors={true}      // Use the 'color' buffer
        transparent={true}
        blending={THREE.AdditiveBlending} // This makes the fire glow
        depthWrite={false}       // Prevents transparency sorting issues
      />
    </points>
  )
}