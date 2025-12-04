import { Router, Request, Response } from 'express';
import admin from 'firebase-admin';

// ============================================================================
// STATUS ENDPOINT - VDB HEALTH CHECK
// ============================================================================

export function statusRouter(
  firestore: admin.firestore.Firestore | undefined,
  firebaseInitialized: boolean
): Router {
  const router = Router();

  interface StatusResponse {
    timestamp: string;
    service: string;
    version: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    vdb_connection: 'VDB_HEALTHY' | 'VDB_DEGRADED' | 'VDB_UNHEALTHY';
    vdb_latency_ms?: number;
    uptime_seconds: number;
    environment: string;
    metrics?: {
      memory_usage_mb: number;
      cpu_percent: number;
    };
  }

  // ========================================================================
  // GET /api/v1/status - Complete System Health Check
  // ========================================================================

  router.get('/status', async (_req: Request, res: Response) => {
    const startTime = Date.now();
    let vdbLatency = 0;
    let vdbConnection: 'VDB_HEALTHY' | 'VDB_DEGRADED' | 'VDB_UNHEALTHY' = 'VDB_UNHEALTHY';
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'unhealthy';

    try {
      // Perform VDB health check if Firebase is initialized
      if (firebaseInitialized && firestore) {
        try {
          const vdbCheckStart = Date.now();

          // Test 1: Perform a lightweight read from system collection
          const systemRef = firestore.collection('_system');
          const versionDoc = await systemRef.doc('version').get();
          
          // Test 2: Write a health check record with timestamp
          const healthCheckRef = firestore.collection('_health');
          const checkId = `check_${Date.now()}`;
          
          await healthCheckRef.doc(checkId).set({
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            service: 'gateway',
            status: 'healthy',
            latency_ms: Date.now() - vdbCheckStart,
          });

          // Test 3: Verify the write was successful (eventual consistency check)
          const writtenDoc = await healthCheckRef.doc(checkId).get();
          
          vdbLatency = Date.now() - vdbCheckStart;
          
          if (writtenDoc.exists) {
            vdbConnection = vdbLatency < 5000 ? 'VDB_HEALTHY' : 'VDB_DEGRADED';
            overallStatus = vdbConnection === 'VDB_HEALTHY' ? 'healthy' : 'degraded';
          } else {
            vdbConnection = 'VDB_DEGRADED';
            overallStatus = 'degraded';
          }
        } catch (vdbError) {
          console.error('❌ VDB health check failed:', vdbError);
          vdbConnection = 'VDB_DEGRADED';
          overallStatus = 'degraded';
        }
      } else if (!firebaseInitialized) {
        vdbConnection = 'VDB_UNHEALTHY';
        overallStatus = 'unhealthy';
      }

      const totalLatency = Date.now() - startTime;

      // Memory usage (approximate)
      const memUsage = process.memoryUsage();
      const memoryUsageMb = Math.round(memUsage.heapUsed / 1024 / 1024);

      const response: StatusResponse = {
        timestamp: new Date().toISOString(),
        service: 'infinity-gateway',
        version: '1.0.0',
        status: overallStatus,
        vdb_connection: vdbConnection,
        uptime_seconds: Math.floor(process.uptime()),
        environment: process.env.NODE_ENV || 'development',
        metrics: {
          memory_usage_mb: memoryUsageMb,
          cpu_percent: 0, // CPU calculation would require additional metrics
        },
      };

      // Include latency only if VDB check was performed
      if (vdbLatency > 0) {
        response.vdb_latency_ms = vdbLatency;
      }

      const statusCode = overallStatus === 'healthy' ? 200 : 
                        overallStatus === 'degraded' ? 503 : 
                        500;

      res.status(statusCode).json(response);
    } catch (error) {
      console.error('❌ Status endpoint error:', error);

      const errorResponse: StatusResponse = {
        timestamp: new Date().toISOString(),
        service: 'infinity-gateway',
        version: '1.0.0',
        status: 'unhealthy',
        vdb_connection: 'VDB_UNHEALTHY',
        uptime_seconds: Math.floor(process.uptime()),
        environment: process.env.NODE_ENV || 'development',
      };

      res.status(500).json(errorResponse);
    }
  });

  // ========================================================================
  // GET /api/v1/status/vdb - Detailed VDB Diagnostics
  // ========================================================================

  router.get('/status/vdb', async (_req: Request, res: Response) => {
    try {
      if (!firebaseInitialized || !firestore) {
        return res.status(503).json({
          status: 'unavailable',
          message: 'Firebase not initialized',
        });
      }

      const diagnostics = {
        timestamp: new Date().toISOString(),
        firestore_initialized: firebaseInitialized,
        collections_tested: [] as string[],
        read_latency_ms: 0,
        write_latency_ms: 0,
        overall_status: 'unknown' as 'healthy' | 'degraded' | 'unhealthy',
      };

      // Test read latency
      const readStart = Date.now();
      await firestore.collection('_system').doc('version').get();
      diagnostics.read_latency_ms = Date.now() - readStart;
      diagnostics.collections_tested.push('_system');

      // Test write latency
      const writeStart = Date.now();
      const testDoc = firestore.collection('_diagnostics').doc(`test_${Date.now()}`);
      await testDoc.set({ timestamp: new Date().toISOString() });
      diagnostics.write_latency_ms = Date.now() - writeStart;
      diagnostics.collections_tested.push('_diagnostics');

      diagnostics.overall_status = 
        diagnostics.read_latency_ms < 5000 && diagnostics.write_latency_ms < 5000
          ? 'healthy'
          : 'degraded';

      res.status(200).json(diagnostics);
    } catch (error) {
      console.error('❌ VDB diagnostics error:', error);
      res.status(500).json({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // ========================================================================
  // GET /api/v1/status/system - System Information
  // ========================================================================

  router.get('/status/system', (_req: Request, res: Response) => {
    const uptime = process.uptime();
    const memUsage = process.memoryUsage();

    res.status(200).json({
      timestamp: new Date().toISOString(),
      uptime_seconds: Math.floor(uptime),
      node_version: process.version,
      platform: process.platform,
      memory: {
        rss_mb: Math.round(memUsage.rss / 1024 / 1024),
        heap_used_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
        heap_total_mb: Math.round(memUsage.heapTotal / 1024 / 1024),
        external_mb: Math.round(memUsage.external / 1024 / 1024),
      },
      environment: {
        node_env: process.env.NODE_ENV || 'development',
        firebase_initialized: firebaseInitialized,
        cors_enabled: true,
        helmet_enabled: true,
      },
    });
  });

  return router;
}
