import React, { useState, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { OrbitControls, Cylinder } from '@react-three/drei'
import FireParticles from './FireParticles'

/**
 * Main component that sets up the 3D scene, UI controls, and post-processing.
 */
export default function FireSimulation() {
  // The single source of truth for fire energy, controlled by the slider.
  const [energyPercent, setEnergyPercent] = useState(50)

  return (
    <div className="app">
      {/* Set up the R3F Canvas */}
      <Canvas camera={{ position: [0, 7, 20], fov: 60 }}>
        {/* A dark background color */}
        <color attach="background" args={['#05050a']} />

        {/* A very dim ambient light to give the cylinder shape */}
        <ambientLight intensity={0.1} />

        <Suspense fallback={null}>
          {/* The "fire pit" base. 
              The fire particles will spawn from [0, 0, 0] */}
          <Cylinder args={[3, 3, 0.5, 32]} position={[0, -0.25, 0]}>
            <meshStandardMaterial color="#222222" roughness={0.8} />
          </Cylinder>

          {/* The heart of the simulation, passing the energy prop */}
          <FireParticles energyPercent={energyPercent} />
        </Suspense>

        {/* Post-processing for the "glow" effect */}
        <EffectComposer>
          <Bloom
            intensity={1.0}           // Bloom intensity
            luminanceThreshold={0.5}  // Only bloom bright parts (the fire core)
            luminanceSmoothing={0.5}  // Smooth transition
            mipmapBlur={true}         // Nicer, softer blur
          />
        </EffectComposer>

        {/* Controls to orbit the camera */}
        <OrbitControls />
      </Canvas>

      {/* The UI panel, overlaid on top */}
      <div className="controls">
        <label htmlFor="energyRangeSlider">
          Energy: <strong>{energyPercent}%</strong>
        </label>
        <input
          id="energyRangeSlider"
          type="range"
          min="10"
          max="100"
          value={energyPercent}
          onChange={(e) => setEnergyPercent(Number(e.target.value))}
          aria-label="Fire energy in percent"
        />
      </div>
    </div>
  )
}