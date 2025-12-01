# Voxel Editor
A lightweight, modern voxel editor built with Electron, React, TypeScript, and Vite.

## Project Structure
```
voxelEditor/
├── src/
│   ├── main/           # Electron main process
│   ├── preload/        # Preload scripts
│   └── renderer/       # React frontend
│       └── types/      # Type definitions
├── dist/               # Built files
├── package.json        # Dependencies and scripts
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript config (renderer)
├── tsconfig.main.json  # TypeScript config (main process)
├── tsconfig.preload.json # TypeScript config (preload)
└── tsconfig.node.json  # TypeScript config (Vite)
```

## NPM Commands
- `npm run dev` - Start both Vite dev server and Electron in development mode
- `npm run dev:vite` - Start only the Vite development server
- `npm run dev:electron` - Start only Electron (waits for Vite server)
- `npm run electron` - Start Electron directly
- `npm run build` - Build the entire application for production
- `npm run build:main` - Build only the main process
- `npm run build:preload` - Build only the preload script
- `npm run preview` - Preview the production build with Vite