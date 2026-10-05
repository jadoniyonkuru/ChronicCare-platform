import { Module } from '@nestjs/common';
import { Clock, SystemClock } from '../common/clock.js';
import { DATABASE, type DatabaseClient } from '../database/database.types.js';
import {
  CareTeamController,
  ProviderPatientsController,
} from './care-team.controller.js';
import {
  CareTeamRepository,
  InMemoryCareTeamRepository,
} from './care-team.repository.js';
import { CareTeamService } from './care-team.service.js';
import { PostgresCareTeamRepository } from './postgres-care-team.repository.js';

@Module({
  controllers: [CareTeamController, ProviderPatientsController],
  providers: [
    CareTeamService,
    { provide: Clock, useClass: SystemClock },
    {
      provide: CareTeamRepository,
      inject: [DATABASE],
      useFactory: (db: DatabaseClient | null): CareTeamRepository =>
        db
          ? new PostgresCareTeamRepository(db)
          : new InMemoryCareTeamRepository(),
    },
  ],
  exports: [CareTeamRepository],
})
export class CareTeamModule {}
