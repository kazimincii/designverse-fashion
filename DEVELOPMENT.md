# Nim - Development Guide

This document provides instructions for setting up and running the Nim AI video creation platform locally.

## Prerequisites

- Node.js 18+ and npm 9+
- Docker and Docker Compose (for database and Redis)
- PostgreSQL 15+ (if not using Docker)
- Redis 7+ (if not using Docker)

## Project Structure

```
designverse-fashion/
├── packages/
│   ├── backend/          # Express.js API server
│   │   ├── src/
│   │   │   ├── controllers/   # Request handlers
│   │   │   ├── routes/        # API routes
│   │   │   ├── services/      # Business logic
│   │   │   ├── middleware/    # Custom middleware
│   │   │   ├── config/        # Configuration files
│   │   │   └── utils/         # Utility functions
│   │   └── prisma/           # Database schema
│   └── frontend/         # React + Vite frontend
│       ├── src/
│       │   ├── components/    # Reusable components
│       │   ├── pages/         # Page components
│       │   ├── services/      # API clients
│       │   ├── contexts/      # React contexts
│       │   └── types/         # TypeScript types
│       └── public/
├── docker-compose.yml
└── README.md
```

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd designverse-fashion
```

### 2. Environment Setup

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` and update the following variables:

```env
# Backend
NODE_ENV=development
PORT=3001
DATABASE_URL="postgresql://postgres:password@localhost:5432/nim_db?schema=public"
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# AI Providers (add your API keys)
OPENAI_API_KEY=your-openai-key

# Storage (optional for MVP)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
S3_BUCKET_NAME=nim-videos

# Frontend
VITE_API_URL=http://localhost:3001
```

### 3. Start Database and Redis with Docker

```bash
docker-compose up -d postgres redis
```

### 4. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd packages/backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
cd ../..
```

### 5. Setup Database

```bash
cd packages/backend
npx prisma generate
npx prisma migrate dev
cd ../..
```

### 6. Start Development Servers

From the root directory:

```bash
# Start both backend and frontend
npm run dev

# Or start them separately:
# Backend (port 3001)
npm run dev:backend

# Frontend (port 3000)
npm run dev:frontend
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Health: http://localhost:3001/health

## Available Scripts

### Root Level

- `npm run dev` - Start both backend and frontend in development mode
- `npm run build` - Build both backend and frontend
- `npm run docker:up` - Start all Docker services
- `npm run docker:down` - Stop all Docker services

### Backend

- `npm run dev` - Start backend in development mode with nodemon
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)

### Frontend

- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Database Management

### Create a New Migration

```bash
cd packages/backend
npx prisma migrate dev --name your_migration_name
```

### Reset Database

```bash
cd packages/backend
npx prisma migrate reset
```

### Open Prisma Studio

```bash
cd packages/backend
npx prisma studio
```

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (authenticated)

### Story Endpoints

- `POST /api/stories` - Create new story (authenticated)
- `GET /api/stories/my-stories` - Get user's stories (authenticated)
- `GET /api/stories/feed` - Get public feed
- `GET /api/stories/:id` - Get story by ID
- `PATCH /api/stories/:id` - Update story (authenticated)
- `DELETE /api/stories/:id` - Delete story (authenticated)

### Clip Endpoints

- `POST /api/clips` - Add clip to story (authenticated)
- `PATCH /api/clips/:id` - Update clip (authenticated)
- `DELETE /api/clips/:id` - Delete clip (authenticated)
- `POST /api/clips/reorder/:storyId` - Reorder clips (authenticated)

### Social Endpoints

- `POST /api/social/stories/:storyId/like` - Toggle like (authenticated)
- `GET /api/social/stories/:storyId/comments` - Get comments
- `POST /api/social/stories/:storyId/comments` - Add comment (authenticated)
- `DELETE /api/social/comments/:id` - Delete comment (authenticated)
- `POST /api/social/users/:userId/follow` - Toggle follow (authenticated)
- `GET /api/social/users/:handle/profile` - Get user profile
- `GET /api/social/notifications` - Get notifications (authenticated)

## Docker Deployment

### Build and Run All Services

```bash
docker-compose up --build
```

### Stop All Services

```bash
docker-compose down
```

### View Logs

```bash
docker-compose logs -f
```

## Testing

Create test user:

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123",
    "displayName": "Test User",
    "handle": "testuser"
  }'
```

## Troubleshooting

### Database Connection Issues

1. Check if PostgreSQL is running: `docker-compose ps`
2. Verify DATABASE_URL in .env
3. Try resetting: `cd packages/backend && npx prisma migrate reset`

### Port Already in Use

If ports 3000 or 3001 are already in use:

```bash
# Find process using the port
lsof -i :3000
lsof -i :3001

# Kill the process
kill -9 <PID>
```

### Module Not Found Errors

```bash
# Clean install
rm -rf node_modules package-lock.json
rm -rf packages/*/node_modules packages/*/package-lock.json
npm install
cd packages/backend && npm install
cd ../frontend && npm install
```

## MVP Features Implemented

✅ User authentication (JWT)
✅ Story creation and management
✅ Clip management (upload/reorder)
✅ Social features (likes, comments, follows)
✅ User profiles and portfolios
✅ Public feed and discovery
✅ Notification system
✅ Workspace with story organization
✅ Story editor interface
✅ Public story viewing
✅ Credits and plans system (data model)

## Next Steps (Post-MVP)

- [ ] AI video generation integration
- [ ] File upload to cloud storage (S3/equivalent)
- [ ] Video processing pipeline
- [ ] Prompt enhancement AI
- [ ] Story templates implementation
- [ ] Advanced timeline editor
- [ ] Music library integration
- [ ] Video export functionality
- [ ] Email notifications
- [ ] Mobile responsive improvements
- [ ] Performance optimization
- [ ] Tests (unit & integration)

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -m 'Add your feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Open a Pull Request

## License

Private - All rights reserved
