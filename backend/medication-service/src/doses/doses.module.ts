import { Module } from '@nestjs/common';
import { Clock, SystemClock } from '../common/clock.js';
import { DATABASE, type DatabaseClient } from '../database/database.types.js';
import { MedicationsModule } from '../medications/medications.module.js';
import {
  DoseLogsRepository,
  InMemoryDoseLogsRepository,
} from './dose-logs.repository.js';
import { DosesController } from './doses.controller.js';
import { DosesService } from './doses.service.js';
import { PostgresDoseLogsRepository } from './postgres-dose-logs.repository.js';

@Module({
  imports: [MedicationsModule],
  controllers: [DosesController],
  providers: [
    DosesService,
    { provide: Clock, useClass: SystemClock },
    {
      provide: DoseLogsRepository,
      inject: [DATABASE],
      useFactory: (db: DatabaseClient | null): DoseLogsRepository =>
        db
          ? new PostgresDoseLogsRepository(db)
          : new InMemoryDoseLogsRepository(),
    },
  ],
  exports: [DoseLogsRepository, Clock],
})
export class DosesModule {}
