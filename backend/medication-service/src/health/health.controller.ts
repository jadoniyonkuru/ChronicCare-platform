import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/auth.guards.js';
import { HealthStatus } from './health-status.entity.js';

@Public()
@ApiTags('health')
@Controller('health')
export class HealthController {
  /** Check that the service is running. */
  @Get()
  check(): HealthStatus {
    return {
      status: 'ok',
      service: 'medication-service',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
