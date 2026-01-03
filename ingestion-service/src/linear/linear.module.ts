import { Module } from '@nestjs/common';
import { LinearService } from './linear.service';

@Module({
  imports: [],
  providers: [LinearService],
})
export class LinearModule {}
