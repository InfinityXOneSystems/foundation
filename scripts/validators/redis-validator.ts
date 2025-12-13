/**
 * Redis Validator
 * Validates Redis connection
 */

import { ValidationResult, ServiceValidator, createValidationResult } from './types';
import * as net from 'net';
import { URL } from 'url';

export class RedisValidator implements ServiceValidator {
  name = 'Redis';

  async validate(redisUrl: string): Promise<ValidationResult> {
    if (!redisUrl) {
      return createValidationResult(
        this.name,
        'REDIS_URL',
        false,
        'Redis URL is not set',
        'Set REDIS_URL with a valid Redis connection string (e.g., redis://localhost:6379)'
      );
    }

    try {
      // Parse Redis URL
      const url = new URL(redisUrl);
      const host = url.hostname;
      const port = parseInt(url.port || '6379', 10);
      const password = url.password;

      // Test connection with a simple socket connection
      const result = await this.testConnection(host, port, password);
      
      if (result.success) {
        return createValidationResult(
          this.name,
          'REDIS_URL',
          true,
          'Redis connection successful',
          undefined,
          {
            host,
            port,
            authenticated: !!password,
          }
        );
      } else {
        return createValidationResult(
          this.name,
          'REDIS_URL',
          false,
          `Redis connection failed: ${result.error}`,
          'Verify Redis is running and accessible. Check host, port, and credentials.',
          { host, port, error: result.error }
        );
      }
    } catch (error: any) {
      return createValidationResult(
        this.name,
        'REDIS_URL',
        false,
        `Invalid Redis URL: ${error.message}`,
        'Use format: redis://[username:password@]host:port',
        { error: error.message }
      );
    }
  }

  private testConnection(host: string, port: number, password?: string): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      const timeout = 5000; // 5 seconds

      const cleanup = () => {
        socket.destroy();
      };

      socket.setTimeout(timeout);

      socket.on('connect', () => {
        // Send PING command
        // Note: This uses a simple Redis protocol for basic validation
        // For production use, consider using a proper Redis client library (e.g., ioredis)
        let command = 'PING\r\n';
        if (password) {
          command = `AUTH ${password}\r\nPING\r\n`;
        }
        socket.write(command);
      });

      socket.on('data', (data) => {
        cleanup();
        const response = data.toString();
        if (response.includes('PONG') || response.includes('+OK')) {
          resolve({ success: true });
        } else if (response.includes('-ERR') || response.includes('-NOAUTH')) {
          resolve({ success: false, error: 'Authentication failed' });
        } else {
          resolve({ success: false, error: `Unexpected response: ${response}` });
        }
      });

      socket.on('error', (error) => {
        cleanup();
        resolve({ success: false, error: error.message });
      });

      socket.on('timeout', () => {
        cleanup();
        resolve({ success: false, error: 'Connection timeout' });
      });

      socket.connect(port, host);
    });
  }
}
