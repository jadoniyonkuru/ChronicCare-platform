import {
  Global,
  Inject,
  Logger,
  Module,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createDatabase, migrateToLatest } from './create-database.js';
import { DATABASE, type DatabaseClient } from './database.types.js';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE,
      inject: [ConfigService],
      useFactory: async (
        config: ConfigService,
      ): Promise<DatabaseClient | null> => {
        const logger = new Logger('Database');
        const url = config.get<string>('DATABASE_URL');
        if (!url) {
          logger.warn('DATABASE_URL is not set; using in-memory storage');
          return null;
        }

        const db = createDatabase(url);
        const applied = await migrateToLatest(db);
        logger.log(
          applied.length > 0
            ? `Applied migrations: ${applied.join(', ')}`
            : 'Database schema is up to date',
        );
        return db;
      },
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(DATABASE) private readonly db: DatabaseClient | null) {}

  async onApplicationShutdown(): Promise<void> {
    await this.db?.destroy();
  }
}
