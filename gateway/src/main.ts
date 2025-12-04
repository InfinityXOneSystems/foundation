import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import { statusRouter } from './api/status';

// ============================================================================
// APPLICATION INITIALIZATION
// ============================================================================

const app: Express = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================================================
// FIREBASE INITIALIZATION WITH INJECTED CREDENTIALS
// ============================================================================

let firestore: admin.firestore.Firestore;
let firebaseInitialized = false;
let firebaseError: string | null = null;

async function initializeFirebase(): Promise<void> {
  try {
    // Parse GCP auth JSON from environment variable
    const gcpAuthJson = process.env.GOOGLE_GCP_AUTH_JSON;
    
    if (!gcpAuthJson) {
      throw new Error('GOOGLE_GCP_AUTH_JSON environment variable not set');
    }

    let serviceAccount;
    try {
      serviceAccount = JSON.parse(gcpAuthJson);
    } catch (parseError) {
      throw new Error(`Failed to parse GOOGLE_GCP_AUTH_JSON: ${parseError}`);
    }

    // Initialize Firebase Admin SDK
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      projectId: serviceAccount.project_id,
    });

    // Get Firestore instance
    firestore = admin.firestore();

    // Test connection to Firestore
    const testCollection = firestore.collection('_system');
    const testDoc = await testCollection.doc('firebase_init_test').get();
    
    firebaseInitialized = true;
    console.log('✅ Firebase Admin SDK initialized successfully');
    console.log(`   Project ID: ${serviceAccount.project_id}`);
  } catch (error) {
    firebaseError = error instanceof Error ? error.message : String(error);
    console.error('❌ Firebase initialization failed:', firebaseError);
  }
}

// ============================================================================
// MIDDLEWARE CONFIGURATION
// ============================================================================

// Security headers
app.use(helmet());

// Logging
app.use(morgan('combined'));

// CORS
app.use(cors({
  origin: process.env.CORS_ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request ID middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  req.id = req.headers['x-request-id'] as string || uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// ============================================================================
// ROUTES
// ============================================================================

// Health check endpoint (basic liveness probe)
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
  });
});

// Status endpoint with VDB health check (from api/status.ts)
app.use('/api/v1', statusRouter(firestore, firebaseInitialized));

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    name: 'Infinity Gateway',
    version: '1.0.0',
    status: 'operational',
    firebase: firebaseInitialized ? 'connected' : 'failed',
    endpoints: {
      health: '/health',
      status: '/api/v1/status',
    },
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: NODE_ENV === 'production' ? 'An error occurred' : err.message,
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

async function startServer(): Promise<void> {
  try {
    // Initialize Firebase first
    await initializeFirebase();

    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`\n${'='.repeat(60)}`);
      console.log('🚀 Infinity Gateway Service Started');
      console.log(`${'='.repeat(60)}`);
      console.log(`📍 Server:       http://localhost:${PORT}`);
      console.log(`🌍 Environment:  ${NODE_ENV}`);
      console.log(`🔥 Firebase:     ${firebaseInitialized ? '✅ Connected' : '❌ Failed'}`);
      console.log(`${'='.repeat(60)}\n`);
    });

    // Graceful shutdown
    const shutdown = () => {
      console.log('\n🛑 Shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed');
        if (admin.apps.length > 0) {
          admin.app().delete();
          console.log('✅ Firebase Admin SDK cleaned up');
        }
        process.exit(0);
      });
      
      // Force exit after 10 seconds
      setTimeout(() => {
        console.error('❌ Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// ============================================================================
// EXPORT FOR TESTING & TYPE DECLARATION
// ============================================================================

declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

export { app, firestore, firebaseInitialized };

// Start server if this is the main module
if (require.main === module) {
  startServer();
}
