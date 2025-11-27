import { useEffect, useRef } from 'react'
import { gaussianRandom } from '../lib/gaussian'
import { createFireParticle } from '../lib/createParticle'
import { computeParticleColorRGBA } from '../lib/colors'

/*
 * Hook that owns the animation loop and particle list lifecycle.
 *
 * @param {React.RefObject<HTMLCanvasElement>} canvasRef - target canvas element for drawing
 * @param {number} energyPercent - user-controlled energy in the range [10..100]
*/

export default function useFireAnimation(canvasRef, energyPercent) {
  // Keep the animation frame ID to cancel cleanly on unmount/energy changes.
  const animationFrameIdRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: false })
    const canvasWidthPx = canvas.width
    const canvasHeightPx = canvas.height

    // Internal particle container for the current hook instance.
    /* @type {Array<import('../lib/createParticle').FireParticle>} */
    let liveParticles = []

    // Frame counter for deterministic-looking turbulence over time.
    let frameIndex = 0

    /*
     * Single animation frame:
     * - clear the canvas with a translucent fill to get a soft "smoke/trail" look
     * - spawn new particles (rate depends on energy)
     * - update physics for each particle (buoyancy, turbulence, drag, centripetal pull)
     * - draw surviving particles (radial gradient + optional glow)
     * - schedule the next frame
    */

    const tick = () => {
      // 1) Clear with a faint, translucent dark fill -> maintains gentle motion trails.
      ctx.fillStyle = 'rgba(10, 10, 15, 0.2)'
      ctx.fillRect(0, 0, canvasWidthPx, canvasHeightPx)

      // 2) Spawn logic
      //    Higher energy -> more particles and a higher maximum ceiling.
      const spawnPerFrame = 5 + Math.floor(energyPercent / 10)     // e.g., 10% -> 6, 100% -> 15
      const particleCountCap = 400 + Math.floor(energyPercent * 3) // e.g., 10% -> 430, 100% -> 700+

      for (let i = 0; i < spawnPerFrame; i++) {
        if (liveParticles.length < particleCountCap) {
          liveParticles.push(
            createFireParticle(canvasWidthPx, canvasHeightPx, energyPercent, gaussianRandom)
          )
        }
      }

      // 3) Update + Render
      liveParticles = liveParticles.filter((p) => {
        const energyScalar01 = energyPercent / 100 // [0.1..1.0] in practice

        // 3.a) Buoyancy (updraft): stronger when energy is higher.
        const buoyancyUpdraft = 0.09 * energyScalar01
        p.velocityY -= buoyancyUpdraft

        // 3.b) Lateral turbulence: stronger at lower energy (wider flame "onion" look).
        const turbulenceNoiseStrength = (1 - energyScalar01) * 0.15
        const deterministicNoise = Math.sin(frameIndex * 0.04 + p.positionX * 0.02)
        const lateralNoise = deterministicNoise * turbulenceNoiseStrength
        const rareLateralSpike = Math.random() < 0.02 ? (Math.random() - 0.5) * 0.4 : 0
        p.velocityX += lateralNoise + (Math.random() - 0.5) * turbulenceNoiseStrength + rareLateralSpike

        // 3.c) Gentle re-circulation: pull back towards the center-line so the flame doesn't drift away.
        //Burst-tagged particles experience weaker pull (they can split off visibly).
        const canvasCenterX = canvasWidthPx / 2
        const dxFromCenter = p.positionX - canvasCenterX
        const recirculationStrength = p.receivedBurstEnergy ? 0.5 : 1.0
        const centripetalForce =
          -dxFromCenter * 0.002 * (1 - energyScalar01 * 0.5) * recirculationStrength
        p.velocityX += centripetalForce

        // 3.d) Integrate velocity -> position (Euler integration)
        p.positionX += p.velocityX
        p.positionY += p.velocityY

        // 3.e) Energy decay (shorter life at the edges, unless it had a burst)
        const atEdgePenalty = p.receivedBurstEnergy ? 0 : p.normalizedDistanceFromCenter * 0.3
        const baseEnergyLossPerFrame = 0.8 + (1 - energyScalar01) * 1.2
        const actualEnergyLoss = baseEnergyLossPerFrame * (1 + atEdgePenalty)
        p.remainingEnergy -= actualEnergyLoss

        // Normalized life in [0..1] for sizing/alpha
        p.lifeFraction = Math.max(0, p.remainingEnergy / p.initialEnergy)

        // 3.f) Air drag – slightly stronger with higher energy to stabilize the fast jets.
        const dragFactorX = 0.94 + energyScalar01 * 0.04 // [0.94..0.98]
        const dragFactorY = 0.96 + energyScalar01 * 0.02 // [0.96..0.98]
        p.velocityX *= dragFactorX
        p.velocityY *= dragFactorY

        // 3.g) Draw the particle if still alive and on-screen bounds
        const onScreen =
          p.remainingEnergy > 0 &&
          p.positionY > -30 &&
          p.positionX > -30 &&
          p.positionX < canvasWidthPx + 30

        if (!onScreen) return false

        // Particle visual size shrinks with its remaining life for a natural fade-out.
        const pixelRadius = p.basePixelRadius * (0.5 + p.lifeFraction * 0.5)

        // Fill a soft radial gradient circle (center = opaque color, edge = transparent).
        ctx.beginPath()
        ctx.arc(p.positionX, p.positionY, pixelRadius, 0, Math.PI * 2)

        const radial = ctx.createRadialGradient(
          p.positionX, p.positionY, 0,
          p.positionX, p.positionY, pixelRadius
        )

        const rgba = computeParticleColorRGBA(p, energyPercent)
        // Middle and edge stops reuse the RGBA base but lower the alpha channel.
        radial.addColorStop(0.0, rgba)
        radial.addColorStop(0.5, rgba.replace(/[\d.]+\)$/, (p.lifeFraction * 0.6) + ')'))
        radial.addColorStop(1.0, rgba.replace(/[\d.]+\)$/, '0)'))

        ctx.fillStyle = radial
        ctx.fill()

        // Optional soft bloom around hotter cores.
        if (p.lifeFraction > 0.4) {
          ctx.beginPath()
          ctx.arc(p.positionX, p.positionY, pixelRadius * 2.5, 0, Math.PI * 2)
          const bloomAlpha = p.lifeFraction * 0.12
          ctx.fillStyle = rgba.replace(/[\d.]+\)$/, bloomAlpha + ')')
          ctx.fill()
        }

        // A second smaller glow for very fresh/high-energy particles.
        if (energyScalar01 > 0.5 && p.lifeFraction > 0.6) {
          ctx.beginPath()
          ctx.arc(p.positionX, p.positionY, pixelRadius * 1.5, 0, Math.PI * 2)
          ctx.fillStyle = rgba.replace(/[\d.]+\)$/, (p.lifeFraction * 0.2) + ')')
          ctx.fill()
        }

        return true
      })

      frameIndex++
      animationFrameIdRef.current = requestAnimationFrame(tick)
    }

    // Start the loop.
    tick()

    // Cleanup on energy change or component unmount.
    return () => {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current)
    }
  }, [canvasRef, energyPercent])
}
