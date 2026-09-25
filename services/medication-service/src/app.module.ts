import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module.js';
import { MedicationsModule } from './medications/medications.module.js';

@Module({
  imports: [HealthModule, MedicationsModule],
})
export class AppModule {}
