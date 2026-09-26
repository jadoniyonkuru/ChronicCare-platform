import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module.js';
import { DosesModule } from './doses/doses.module.js';
import { HealthModule } from './health/health.module.js';
import { MedicationsModule } from './medications/medications.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    HealthModule,
    MedicationsModule,
    DosesModule,
  ],
})
export class AppModule {}
