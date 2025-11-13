# Nim Frontend

React frontend for the Nim AI video creation platform.

## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **State Management**: React Query + Zustand
- **Routing**: React Router v6
- **Animation**: Framer Motion
- **Icons**: Lucide React

## Features

- User authentication and registration
- Story workspace and editor
- Social feed and discovery
- User profiles and portfolios
- Responsive design
- Dark theme

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Server will start at http://localhost:3000

## Production Build

```bash
npm run build
npm run preview
```

## Docker

```bash
docker build -t nim-frontend .
docker run -p 3000:3000 nim-frontend
```

## Project Structure

```
src/
├── components/     # Reusable components
├── pages/          # Page components
├── services/       # API clients
├── contexts/       # React contexts
├── types/          # TypeScript types
├── utils/          # Utility functions
├── App.tsx         # App component
└── main.tsx        # Entry point
```
