# Flight - Paper Airplane Game

A physics-based paper airplane launching game inspired by the classic Flash game.

## Features

✈️ **Realistic Physics** - Paper airplane flight simulation with Matter.js
🎯 **Launch Mechanic** - Drag and release to throw with power control
⬆️ **Flight Controls** - Control pitch and use boost during flight
💰 **Progression System** - Earn money based on distance and altitude
🛒 **Upgrade Shop** - Improve speed, weight, aerodynamics, and add fuel
⭐ **Collectibles** - Gather stars during flight for bonus money
💾 **Auto-Save** - Progress saved automatically to localStorage

## Controls

### Launching
- **Click and drag** to aim your paper airplane
- Longer drag = more power
- Release to launch!

### During Flight
- **W / Up Arrow** - Pitch up
- **S / Down Arrow** - Pitch down
- **Space** - Use rocket boost (if unlocked)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Run development server:
```bash
npm run dev
```

3. Open browser to http://localhost:5173

## Build for Production

```bash
npm run build
```

## Deploy to Vercel

```bash
npm install -g vercel
vercel
```

## Gameplay Tips

- Balance altitude with forward momentum
- Upgrade aerodynamics early for better control
- Collect stars for extra money
- Rocket fuel is expensive but powerful
- Try to maintain a shallow glide angle

## Tech Stack

- **Vite** - Fast build tool
- **Matter.js** - 2D physics engine
- **HTML5 Canvas** - Rendering
- **Vanilla JavaScript** - Game logic

Enjoy your flight! 🛫
