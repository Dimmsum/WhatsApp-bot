import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LinearModule } from './linear/linear.module';
import { SyncModule } from './sync/sync.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), LinearModule, SyncModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
