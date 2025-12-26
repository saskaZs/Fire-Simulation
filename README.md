# 🔥 Fire Simulations Collection

This repository contains **two independent implementations** of interactive fire particle simulations, both built to explore real-time flame effects:

1. **3D Version** – Powered by **React Three Fiber** (Three.js)  
   A full 3D scene with orbiting camera, bloom post-processing, soft particles, and a glowing fire pit.

2. **2D Version** – Pure **React + Canvas 2D**  
   A lightweight 2D simulation using native canvas drawing, radial gradients, and trail effects — no 3D libraries required.

Both versions feature:
- Adjustable "energy" slider (10–100%) that controls flame intensity, height, spread, and color.
- Gaussian-distributed particle spawning for natural, organic flame shapes.
- Physics-based motion (buoyancy, turbulence, drag, random bursts).
- Realistic color progression from hot white/yellow to cool red/orange.


---

## 🚀 Quick Start

Each project is a standalone Vite + React app.

### For the 3D version:
```bash
cd 3d-fire-r3f
npm install
npm run dev
```

### For the 2D version:
```bash
cd 2d-fire-canvas
npm install
npm run dev
```
