import { Logger, Module } from '@nestjs/common';
import { DATABASE, type DatabaseClient } from '../database/database.types.js';
import { MedicationsController } from './medications.controller.js';
import {
  InMemoryMedicationsRepository,
  MedicationsRepository,
} from './medications.repository.js';
import { MedicationsService } from './medications.service.js';
import { PostgresMedicationsRepository } from './postgres-medications.repository.js';

@Module({
  controllers: [MedicationsController],
  providers: [
    MedicationsService,
    {
      provide: MedicationsRepository,
      inject: [DATABASE],
      useFactory: (db: DatabaseClient | null): MedicationsRepository => {
        if (db) return new PostgresMedicationsRepository(db);
        new Logger('MedicationsModule').warn(
          'Medications are stored in memory and will be lost on restart',
        );
        return new InMemoryMedicationsRepository();
      },
    },
  ],
})
export class MedicationsModule {}
