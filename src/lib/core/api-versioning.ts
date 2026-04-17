// src/lib/core/api-versioning.ts - API Versioning and Compatibility System
export interface APIVersion {
  version: string;
  releaseDate: string;
  supported: boolean;
  deprecated: boolean;
  breaking: boolean;
  features: string[];
  migrations?: Record<string, string>;
}

export interface VersionedRequest {
  version: string;
  originalRequest: Request;
  isLatest: boolean;
  needsMigration: boolean;
}

export class APIVersionManager {
  private versions: Map<string, APIVersion> = new Map();
  private latestVersion = 'v2';

  constructor() {
    this.initializeVersions();
  }

  addVersion(version: APIVersion): void {
    this.versions.set(version.version, version);
  }

  parseVersion(req: Request): VersionedRequest {
    // Check Accept header for version
    const acceptHeader = req.headers.get('Accept') || '';
    const versionMatch = acceptHeader.match(/application\/vnd\.adcreative\.([^+\s]+)\+json/);

    let version = 'v1'; // Default to v1 for backward compatibility

    if (versionMatch) {
      version = versionMatch[1];
    } else {
      // Check query parameter
      const url = new URL(req.url);
      const versionParam = url.searchParams.get('version');
      if (versionParam) {
        version = versionParam;
      }
    }

    const versionInfo = this.versions.get(version);
    const isLatest = version === this.latestVersion;
    const needsMigration = versionInfo ? !versionInfo.supported : false;

    return {
      version,
      originalRequest: req,
      isLatest,
      needsMigration
    };
  }

  validateVersion(version: string): { valid: boolean; message?: string; migrationPath?: string } {
    const versionInfo = this.versions.get(version);

    if (!versionInfo) {
      return {
        valid: false,
        message: `API version '${version}' not found. Supported versions: ${Array.from(this.versions.keys()).join(', ')}`
      };
    }

    if (!versionInfo.supported) {
      return {
        valid: false,
        message: `API version '${version}' is no longer supported. Please upgrade to ${this.latestVersion}.`,
        migrationPath: versionInfo.migrations?.[this.latestVersion]
      };
    }

    if (versionInfo.deprecated) {
      console.warn(`API version '${version}' is deprecated. Consider upgrading to ${this.latestVersion}.`);
    }

    return { valid: true };
  }

  migrateRequest(versionedRequest: VersionedRequest, targetVersion: string = this.latestVersion): Request {
    const sourceVersion = versionedRequest.version;
    const sourceInfo = this.versions.get(sourceVersion);
    const targetInfo = this.versions.get(targetVersion);

    if (!sourceInfo || !targetInfo) {
      throw new Error(`Cannot migrate from ${sourceVersion} to ${targetVersion}`);
    }

    // Clone the request
    const newRequest = new Request(versionedRequest.originalRequest);

    // Apply version-specific transformations
    if (sourceVersion === 'v1' && targetVersion === 'v2') {
      return this.migrateV1ToV2(newRequest);
    }

    return newRequest;
  }

  private migrateV1ToV2(req: Request): Request {
    // V1 to V2 migration logic
    // - Rename fields
    // - Update request structure
    // - Add new required fields with defaults

    const url = new URL(req.url);
    const body = req.body;

    // Update URL path if needed
    if (url.pathname === '/api/generate') {
      // V1 used different parameter names
      // Migrate query parameters
      if (url.searchParams.has('url')) {
        url.searchParams.set('targetUrl', url.searchParams.get('url')!);
        url.searchParams.delete('url');
      }
    }

     return new Request(url.toString(), {
       method: req.method,
       body: body,
       // Add version header and preserve original headers
       headers: {
         ...Object.fromEntries(req.headers.entries()),
         'X-API-Version': 'v2'
       }
     });
  }

  getVersionInfo(version?: string): APIVersion | APIVersion[] {
    if (version) {
      const info = this.versions.get(version);
      if (!info) {
        throw new Error(`Version ${version} not found`);
      }
      return info;
    }

    return Array.from(this.versions.values());
  }

  getSupportedVersions(): string[] {
    return Array.from(this.versions.values())
      .filter(v => v.supported)
      .map(v => v.version)
      .sort()
      .reverse(); // Latest first
  }

  private initializeVersions(): void {
    // Legacy V1 API
    this.addVersion({
      version: 'v1',
      releaseDate: '2024-01-01',
      supported: false, // No longer supported
      deprecated: true,
      breaking: false,
      features: ['basic_generation', 'simple_validation'],
      migrations: {
        v2: 'Automatic migration available. Update client to use new field names.'
      }
    });

    // Current V2 API
    this.addVersion({
      version: 'v2',
      releaseDate: '2024-12-01',
      supported: true,
      deprecated: false,
      breaking: true,
      features: [
        'advanced_pipeline',
        'semantic_validation',
        'performance_monitoring',
        'error_recovery',
        'caching',
        'health_checks',
        'rate_limiting'
      ]
    });
  }
}

// Global API version manager
export const apiVersionManager = new APIVersionManager();

// Middleware for API versioning
export function withAPIVersioning(
  handler: (req: VersionedRequest, ...args: any[]) => Promise<Response>
) {
  return async (req: Request, ...args: any[]) => {
    const versionedRequest = apiVersionManager.parseVersion(req);
    const validation = apiVersionManager.validateVersion(versionedRequest.version);

    if (!validation.valid) {
      return new Response(JSON.stringify({
        success: false,
        error: validation.message,
        migrationPath: validation.migrationPath,
        supportedVersions: apiVersionManager.getSupportedVersions()
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Version': versionedRequest.version,
          'X-Supported-Versions': apiVersionManager.getSupportedVersions().join(', ')
        }
      });
    }

    // Migrate request if needed
    let finalRequest = versionedRequest;
    if (versionedRequest.needsMigration) {
      try {
        const migrated = apiVersionManager.migrateRequest(versionedRequest);
        finalRequest = {
          ...versionedRequest,
          originalRequest: migrated
        };
      } catch (error) {
        console.error('Migration failed:', error);
        return new Response(JSON.stringify({
          success: false,
          error: 'Request migration failed',
          details: (error as Error).message
        }), { status: 400 });
      }
    }

    // Add version headers
    const response = await handler(finalRequest, ...args);
    const headers = new Headers(response.headers);
    headers.set('X-API-Version', finalRequest.version);
    headers.set('X-API-Latest', apiVersionManager.getSupportedVersions()[0]);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  };
}