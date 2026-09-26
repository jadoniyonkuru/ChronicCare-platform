import { Module } from '@nestjs/common';
import { DosesModule } from '../doses/doses.module.js';
import { MedicationsModule } from '../medications/medications.module.js';
import { AdherenceController } from './adherence.controller.js';
import { AdherenceService } from './adherence.service.js';

@Module({
  imports: [MedicationsModule, DosesModule],
  controllers: [AdherenceController],
  providers: [AdherenceService],
})
export class AdherenceModule {}
