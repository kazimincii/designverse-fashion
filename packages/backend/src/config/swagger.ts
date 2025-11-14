import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DesignVerse Fashion API',
      version: '1.0.0',
      description: 'AI-powered fashion photo generation platform with consistency scoring',
      contact: {
        name: 'DesignVerse Team',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' },
          },
        },
        QualityMetrics: {
          type: 'object',
          properties: {
            averageConsistencyScore: { type: 'number' },
            averageFaceScore: { type: 'number' },
            averageGarmentScore: { type: 'number' },
            averageStyleScore: { type: 'number' },
            regenerationRate: { type: 'number' },
            successRate: { type: 'number' },
            totalGenerations: { type: 'number' },
            totalCost: { type: 'number' },
          },
        },
        GenerationHistory: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            sessionId: { type: 'string' },
            consistencyScore: { type: 'number', nullable: true },
            faceSimScore: { type: 'number', nullable: true },
            garmentAccScore: { type: 'number', nullable: true },
            styleMatchScore: { type: 'number', nullable: true },
            modelName: { type: 'string', nullable: true },
            wasRegenerated: { type: 'boolean' },
            userRating: { type: 'number', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Quality', description: 'Quality metrics and analytics' },
      { name: 'Photo Sessions', description: 'Photo generation sessions' },
      { name: 'References', description: 'Character, garment, and style references' },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
