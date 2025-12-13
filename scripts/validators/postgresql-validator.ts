/**
 * PostgreSQL Validator
 * Validates PostgreSQL database connection
 */

import { ValidationResult, ServiceValidator, createValidationResult } from './types.js';
import * as net from 'net';
import { URL } from 'url';

export interface PostgreSQLConfig {
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  url?: string;
}

export class PostgreSQLValidator implements ServiceValidator {
  name = 'PostgreSQL';

  async validate(config: PostgreSQLConfig): Promise<ValidationResult> {
    let host: string;
    let port: number;
    let database: string;
    let user: string;

    // Parse from URL if provided
    if (config.url) {
      try {
        const url = new URL(config.url);
        host = url.hostname;
        port = parseInt(url.port || '5432', 10);
        database = url.pathname.substring(1);
        user = url.username;
      } catch (error: any) {
        return createValidationResult(
          this.name,
          'DATABASE_URL',
          false,
          `Invalid PostgreSQL URL: ${error.message}`,
          'Use format: postgresql://user:password@host:port/database',
          { error: error.message }
        );
      }
    } else {
      // Use individual config values
      host = config.host || 'localhost';
      port = config.port || 5432;
      database = config.database || '';
      user = config.user || '';

      if (!database || !user) {
        return createValidationResult(
          this.name,
          'PG_DATABASE/PG_USER',
          false,
          'PostgreSQL configuration incomplete',
          'Set DATABASE_URL or PG_HOST, PG_PORT, PG_DATABASE, PG_USER, PG_PASSWORD',
          { host, port, database, user }
        );
      }
    }

    // Test basic connectivity
    const connectable = await this.testConnection(host, port);
    
    if (connectable) {
      return createValidationResult(
        this.name,
        config.url ? 'DATABASE_URL' : 'PG_*',
        true,
        'PostgreSQL server is reachable',
        'Note: Full authentication test requires pg client library',
        {
          host,
          port,
          database,
          user,
          connection_test: 'port_open',
        }
      );
    } else {
      return createValidationResult(
        this.name,
        config.url ? 'DATABASE_URL' : 'PG_*',
        false,
        'PostgreSQL server is not reachable',
        'Verify PostgreSQL is running and accessible. Check firewall rules.',
        { host, port, database, user }
      );
    }
  }

  private testConnection(host: string, port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      const timeout = 5000; // 5 seconds

      socket.setTimeout(timeout);

      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });

      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });

      socket.connect(port, host);
    });
  }
}
