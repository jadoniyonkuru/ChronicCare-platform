import { Module } from '@nestjs/common';
import { MedicationsController } from './medications.controller.js';
import {
  InMemoryMedicationsRepository,
  MedicationsRepository,
} from './medications.repository.js';
import { MedicationsService } from './medications.service.js';

@Module({
  controllers: [MedicationsController],
  providers: [
    MedicationsService,
    { provide: MedicationsRepository, useClass: InMemoryMedicationsRepository },
  ],
})
export class MedicationsModule {}
