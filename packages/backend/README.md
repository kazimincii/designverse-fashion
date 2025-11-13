# Nim Backend API

Express.js backend API for the Nim video creation platform.

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 15+
- **ORM**: Prisma
- **Queue**: Bull + Redis
- **Authentication**: JWT + Passport

## Features

- User authentication (JWT + OAuth)
- Story and clip management
- Social features (likes, comments, follows)
- Job queue for async tasks
- Rate limiting
- Error handling
- API validation

## Installation

```bash
npm install
```

## Environment Variables

See `.env.example` in the root directory.

## Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Open Prisma Studio
npx prisma studio
```

## Development

```bash
npm run dev
```

## Production Build

```bash
npm run build
npm start
```

## Docker

```bash
docker build -t nim-backend .
docker run -p 3001:3001 --env-file .env nim-backend
```
