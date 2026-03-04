/**
 * Endpoint Extractor
 *
 * Extracts API endpoints from Python FastAPI code for verification testing
 */

import { ENDPOINT_PATTERNS, STANDARD_ENDPOINTS } from './config.js';

export interface Endpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  expected_status: number;
}

/**
 * Extract all endpoints from Python code
 */
export function extractEndpoints(code: string): Endpoint[] {
  const endpoints: Endpoint[] = [...STANDARD_ENDPOINTS];
  const seenPaths = new Set(endpoints.map(e => `${e.method}:${e.path}`));

  for (const pattern of ENDPOINT_PATTERNS) {
    // Reset regex state
    pattern.lastIndex = 0;
    let match;

    while ((match = pattern.exec(code)) !== null) {
      const method = match[1].toUpperCase() as Endpoint['method'];
      const path = match[2];
      const key = `${method}:${path}`;

      // Skip if already seen
      if (seenPaths.has(key)) {
        continue;
      }

      seenPaths.add(key);
      endpoints.push({
        path,
        method,
        // GET typically returns 200, POST can return 200/201/422
        expected_status: method === 'GET' ? 200 : 200,
      });
    }
  }

  return endpoints;
}

/**
 * Extract endpoints from multiple files
 */
export function extractEndpointsFromFiles(files: Record<string, string>): Endpoint[] {
  const allEndpoints: Endpoint[] = [];
  const seenPaths = new Set<string>();

  // Process main.py first (primary entry point)
  const mainOrder = ['main.py', 'app.py', 'server.py', 'api.py'];

  const sortedFiles = Object.entries(files).sort(([a], [b]) => {
    const aIndex = mainOrder.findIndex(m => a.endsWith(m));
    const bIndex = mainOrder.findIndex(m => b.endsWith(m));
    if (aIndex >= 0 && bIndex >= 0) return aIndex - bIndex;
    if (aIndex >= 0) return -1;
    if (bIndex >= 0) return 1;
    return 0;
  });

  for (const [, content] of sortedFiles) {
    const endpoints = extractEndpoints(content);
    for (const endpoint of endpoints) {
      const key = `${endpoint.method}:${endpoint.path}`;
      if (!seenPaths.has(key)) {
        seenPaths.add(key);
        allEndpoints.push(endpoint);
      }
    }
  }

  return allEndpoints;
}

/**
 * Generate test requests for endpoints
 */
export function generateTestRequests(endpoints: Endpoint[]): Array<{
  endpoint: Endpoint;
  request: {
    url: string;
    method: string;
    body?: string;
    headers?: Record<string, string>;
  };
}> {
  return endpoints.map(endpoint => {
    const baseUrl = `http://localhost:8765`;
    const request: {
      url: string;
      method: string;
      body?: string;
      headers?: Record<string, string>;
    } = {
      url: `${baseUrl}${endpoint.path}`,
      method: endpoint.method,
    };

    // Add body for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
      request.headers = { 'Content-Type': 'application/json' };

      // Special handling for known endpoints
      if (endpoint.path === '/chatkit') {
        request.body = JSON.stringify({
          thread_id: 'test-thread',
          message: { role: 'user', content: 'test' },
        });
      } else {
        // Generic test body
        request.body = JSON.stringify({ test: true });
      }
    }

    return { endpoint, request };
  });
}

/**
 * Endpoint Extractor class (singleton pattern)
 */
export class EndpointExtractor {
  private static instance: EndpointExtractor;

  private constructor() {}

  static getInstance(): EndpointExtractor {
    if (!EndpointExtractor.instance) {
      EndpointExtractor.instance = new EndpointExtractor();
    }
    return EndpointExtractor.instance;
  }

  /**
   * Extract endpoints from code string
   */
  extract(code: string): Endpoint[] {
    return extractEndpoints(code);
  }

  /**
   * Extract endpoints from multiple files
   */
  extractFromFiles(files: Record<string, string>): Endpoint[] {
    return extractEndpointsFromFiles(files);
  }

  /**
   * Generate test requests for endpoints
   */
  generateTests(endpoints: Endpoint[]): ReturnType<typeof generateTestRequests> {
    return generateTestRequests(endpoints);
  }
}

// Export singleton getter
export function getEndpointExtractor(): EndpointExtractor {
  return EndpointExtractor.getInstance();
}
