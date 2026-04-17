// app/api/health/route.ts - System Health Check Endpoint
import { NextResponse } from 'next/server';
import { modernOrchestrator } from '@/lib/core/modern-orchestrator';
import { performanceMonitor } from '@/lib/core/monitoring';

export async function GET() {
  try {
    const health = await modernOrchestrator.getHealth();

    const status = health.status === 'healthy' ? 200 :
                   health.status === 'degraded' ? 200 : 503;

    return NextResponse.json({
      status: health.status,
      timestamp: new Date().toISOString(),
      uptime: health.uptime,
      performance: health.performance,
      cache: health.cache,
      recentErrors: health.errors?.slice(0, 5), // Last 5 errors
      version: '2.0.0'
    }, { status });

  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}