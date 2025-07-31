import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Product Analytics AI API',
      version: '1.0.0',
      description: 'API documentation for Product Analytics AI platform',
      contact: {
        name: 'API Support',
        email: 'support@productanalytics.ai',
      },
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3002',
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User ID',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            name: {
              type: 'string',
              description: 'User name',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User creation timestamp',
            },
          },
        },
        Project: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Project ID',
            },
            name: {
              type: 'string',
              description: 'Project name',
            },
            description: {
              type: 'string',
              description: 'Project description',
            },
            apiKey: {
              type: 'string',
              description: 'Project API key',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Project creation timestamp',
            },
          },
        },
        Event: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Event ID',
            },
            name: {
              type: 'string',
              description: 'Event name',
            },
            properties: {
              type: 'object',
              description: 'Event properties',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Event timestamp',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email',
            },
            password: {
              type: 'string',
              minLength: 6,
              description: 'User password',
            },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email',
            },
            password: {
              type: 'string',
              minLength: 6,
              description: 'User password',
            },
            name: {
              type: 'string',
              description: 'User name',
            },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Operation success status',
            },
            data: {
              type: 'object',
              description: 'Response data',
            },
            error: {
              type: 'string',
              description: 'Error message if failed',
            },
            message: {
              type: 'string',
              description: 'Response message',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              description: 'Error status',
            },
            statusCode: {
              type: 'number',
              description: 'HTTP status code',
            },
            message: {
              type: 'string',
              description: 'Error message',
            },
          },
        },
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts', 
    './src/index.ts',
    './src/**/*.ts'
  ],
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
    customSiteTitle: 'Product Analytics AI - API Documentation',
  }));

  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
};

export default specs;