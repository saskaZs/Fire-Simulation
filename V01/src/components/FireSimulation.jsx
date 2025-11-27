import React, { useRef, useState } from 'react'
import useFireAnimation from '../hooks/useFireAnimations'

/*
 * Minimal UI:
 * - a <canvas> where the fire particles are drawn
 * - a single <input type="range"> that controls fire "energy" (10%..100%)
*/

export default function FireSimulation() {
  const canvasElementRef = useRef(null)

  // Percentage (10..100) is convenient for the UI and maps cleanly to all internal scalars.
  const [energyPercent, setEnergyPercent] = useState(50)

  // Run the particle animation on the provided <canvas> element.
  useFireAnimation(canvasElementRef, energyPercent)

  return (
    <div className="app">
      {/* Fixed canvas size; CSS scales the outer layout only */}
      <canvas ref={canvasElementRef} width={800} height={600} />

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
