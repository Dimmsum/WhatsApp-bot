import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { LinearService } from 'src/linear/linear.service';

@Module({
  imports: [],
  providers: [SyncService, LinearService],
})
export class SyncModule {}
