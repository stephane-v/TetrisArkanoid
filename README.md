# TetriKanoid

A unique asymmetric duel game: Robot plays Tetris vs Player plays Arkanoid!

## Concept

- **The ROBOT** plays Tetris: it intelligently places pieces to complete lines
- **The PLAYER** controls a paddle + ball to DESTROY blocks before lines complete
- **PENALTY**: Each line completed by the robot causes ALL blocks to drop down
- **GAME OVER**: Blocks reach the paddle zone OR no more balls

## How to Play

### Controls

**Desktop:**
- Mouse - Move paddle horizontally
- Arrow Keys / A-D - Alternative paddle movement
- Space - Launch ball / Pause menu actions
- Escape - Pause game

**Mobile:**
- Touch drag - Move paddle
- Tap - Launch ball

### Gameplay Tips

1. Watch for warning indicators on almost-complete lines (6+ blocks)
2. Priority target critical lines (8-9 blocks) shown in red
3. Collect power-ups dropped from destroyed blocks
4. Keep the ball in play while managing the robot's progress

### Power-ups

- **+2** Multi Ball - Adds 2 extra balls
- **<->** Large Paddle - Increases paddle size (15s)
- **(*)** Power Ball - Ball pierces through blocks (10s)
- **|||** Freeze Robot - Stops robot from placing pieces (8s)
- **XXX** Line Bomb - Destroys a random line instantly
- **[=]** Shield - Blocks the next line completion penalty
- **<3** Extra Life - Adds 1 life

## Development

### Prerequisites

- Node.js 20+
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Docker Deployment

```bash
# Build and run with Docker
docker build -t tetrikanoid .
docker run -p 3000:3000 tetrikanoid

# Or use Docker Compose
docker-compose up -d
```

## Tech Stack

- React 18 + TypeScript
- Vite
- Canvas 2D
- Zustand (state management)
- Tailwind CSS

## License

MIT
