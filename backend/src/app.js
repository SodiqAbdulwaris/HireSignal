const config = require('./config/env');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Route Imports
const resumeRoutes = require('./routes/resume.routes');
const candidateRoutes = require('./routes/candidate.routes');
const jobRoutes = require('./routes/job.routes');
const authRoutes = require('./routes/auth.routes');
const contactRoutes = require('./routes/contact.routes');
const adminRoutes = require('./routes/admin.routes');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

// Trust Railway's reverse proxy so express-rate-limit reads the real client IP
// from X-Forwarded-For instead of throwing ERR_ERL_UNEXPECTED_X_FORWARDED_FOR.
app.set('trust proxy', 1);

if (process.env.NODE_ENV === 'production' && config.aiServiceUrl.includes('localhost')) {
  console.warn('[Config] AI_SERVICE_URL points to localhost in production. Resume parsing will fail unless the AI service runs in the same container.');
}

// 1. CORS Configuration
// The allowlist comes exclusively from the validated environment configuration.
const allowedOrigins = config.allowedOrigins;

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or postman)
    if (!origin) return callback(null, true);

    const normalizedOrigin = origin.trim().replace(/\/$/, '');

    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    console.warn(`[CORS] Rejected origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// 2. Global Parsers
app.use(express.json());
app.use(cookieParser());

// Swagger Documentation Config
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'HireSignal API',
      version: '1.0.0',
      description: 'AI Resume Screener backend API',
    },
    servers: [{ url: '/api/v1' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error description' },
            data: { type: 'object', nullable: true, example: null }
          }
        },
        UserResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Success description' },
            data: {
              type: 'object',
              properties: {
                _id: { type: 'string', example: '60c72b2f9b1d8a001c3d4f5g' },
                fullName: { type: 'string', example: 'John Doe' },
                email: { type: 'string', example: 'john@example.com' },
                role: { type: 'string', enum: ['candidate', 'recruiter'], example: 'candidate' }
              }
            }
          }
        },
        JobResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Success description' },
            data: {
              type: 'object',
              properties: {
                _id: { type: 'string', example: '60c72b2f9b1d8a001c3d4f5g' },
                title: { type: 'string', example: 'Software Engineer' },
                description: { type: 'string', example: 'Job description' },
                requiredSkills: { type: 'array', items: { type: 'string' } },
                preferredSkills: { type: 'array', items: { type: 'string' } },
                requiredEducationLevel: { type: 'string', example: 'bachelor' },
                requiredExperienceYears: { type: 'number', example: 2 },
                isOpen: { type: 'boolean', example: true }
              }
            }
          }
        },
        MatchResultResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Success description' },
            data: {
              type: 'object',
              properties: {
                _id: { type: 'string', example: '60c72b2f9b1d8a001c3d4f5g' },
                job: { type: 'string', example: '60c72b2f9b1d8a001c3d4f5a' },
                candidate: { type: 'string', example: '60c72b2f9b1d8a001c3d4f5b' },
                totalScore: { type: 'number', example: 0.85 },
                rankedPosition: { type: 'number', example: 1 },
                shortlisted: { type: 'boolean', example: false }
              }
            }
          }
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Success description' },
            data: {
              type: 'object',
              properties: {
                items: { type: 'array', items: { type: 'object' } },
                nextCursor: { type: 'string', nullable: true, example: '60c72b2f9b1d8a001c3d4f5g' },
                hasMore: { type: 'boolean', example: false }
              }
            }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 3. API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/resumes', resumeRoutes);
app.use('/api/v1/candidates', candidateRoutes);
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1/contact', contactRoutes);
app.use('/api/v1/admin', adminRoutes);

// 4. Health Check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// 5. Global Error Handler (Must be registered after routes)
app.use(errorHandler);

module.exports = app;
