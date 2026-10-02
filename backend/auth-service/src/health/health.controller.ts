import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthStatus } from './health-status.entity.js';

@ApiTags('health')
@Controller('health')
export class HealthController {
  /** Check that the service is running. */
  @Get()
  check(): HealthStatus {
    return {
      status: 'ok',
      service: 'auth-service',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
