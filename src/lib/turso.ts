/**
 * Turso/LibSQL client wrapper using libsql-search
 * Falls back to local SQLite file when Turso credentials aren't available
 */

import {
  type Client,
  createClient,
  type InStatement,
  type TransactionMode,
} from '@libsql/client';
import { logger } from 'logan-logger';

let activeClient: Client | null = null;
let client: Client | null = null;
let isUsingLocalFallback = false;

export function getTursoClient(): Client {
  if (!client) {
    const url = import.meta.env.TURSO_DB_URL || process.env.TURSO_DB_URL;
    const authToken =
      import.meta.env.TURSO_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

    const forceLocal =
      import.meta.env.USE_LOCAL_DB ||
      process.env.USE_LOCAL_DB ||
      (url?.includes('keymesh-keymesh-db') ? 'true' : 'false');

    if (forceLocal === 'true') {
      logger.warn(
        'USE_LOCAL_DB is set or invalid database URL detected, forcing local libSQL database',
      );
      activeClient = createClient({ url: 'file:local.db' });
    } else if (url && authToken) {
      logger.info(`Using Turso database: ${url}`);
      activeClient = createClient({ url, authToken });
    } else {
      logger.warn('Turso credentials not found, using local libSQL database');
      activeClient = createClient({ url: 'file:local.db' });
    }

    // Create a self-healing proxy client
    if (process.env.VITEST || process.env.NODE_ENV === 'test') {
      client = activeClient;
    } else {
      client = new Proxy(activeClient, {
        get(_target, prop, receiver) {
          if (prop === 'execute') {
            return async (stmt: InStatement) => {
              const currentClient = activeClient;
              if (!currentClient) {
                throw new Error('Database client not initialized');
              }
              if (isUsingLocalFallback) {
                return currentClient.execute(stmt);
              }
              try {
                return await currentClient.execute(stmt);
              } catch (error: unknown) {
                const errStr = String(error);
                const isAuthError =
                  errStr.includes('401') ||
                  errStr.includes('unauthorized') ||
                  errStr.includes('UNAUTHORIZED');
                const isNoSuchTable = errStr.includes('no such table');

                if (isAuthError || isNoSuchTable) {
                  logger.error(
                    `Remote database query failed (${errStr}). Falling back to local SQLite database (file:local.db).`,
                  );
                  isUsingLocalFallback = true;

                  try {
                    currentClient.close();
                  } catch {}

                  activeClient = createClient({ url: 'file:local.db' });
                  return activeClient.execute(stmt);
                }
                throw error;
              }
            };
          }

          if (prop === 'batch') {
            return async (stmts: InStatement[], mode?: TransactionMode) => {
              const currentClient = activeClient;
              if (!currentClient) {
                throw new Error('Database client not initialized');
              }
              if (isUsingLocalFallback) {
                return currentClient.batch(stmts, mode);
              }
              try {
                return await currentClient.batch(stmts, mode);
              } catch (error: unknown) {
                const errStr = String(error);
                const isAuthError =
                  errStr.includes('401') ||
                  errStr.includes('unauthorized') ||
                  errStr.includes('UNAUTHORIZED');
                const isNoSuchTable = errStr.includes('no such table');

                if (isAuthError || isNoSuchTable) {
                  logger.error(
                    `Remote database batch query failed (${errStr}). Falling back to local SQLite database (file:local.db).`,
                  );
                  isUsingLocalFallback = true;

                  try {
                    currentClient.close();
                  } catch {}

                  activeClient = createClient({ url: 'file:local.db' });
                  return activeClient.batch(stmts, mode);
                }
                throw error;
              }
            };
          }

          // Delegate everything else to the active client
          const currentClient = activeClient;
          if (!currentClient) {
            return undefined;
          }
          const value = Reflect.get(currentClient, prop, receiver);
          if (typeof value === 'function') {
            return value.bind(currentClient);
          }
          return value;
        },
      });
    }
  }

  return client;
}

// Re-export search utilities from libsql-search
export {
  getAllArticles,
  getArticleBySlug,
  getArticlesByFolder,
  getFolders,
} from '@logan/libsql-search';
