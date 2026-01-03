import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SyncService } from './sync/sync.service';

async function bootstrap() {
  // const app = await NestFactory.create(AppModule);
  // await app.listen(process.env.PORT ?? 3000);
  const app = await NestFactory.create(AppModule);

  const syncService = app.get(SyncService);
  await syncService.syncData();

  await app.close();
}
bootstrap();
