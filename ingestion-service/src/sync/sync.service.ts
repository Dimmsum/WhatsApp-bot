import { Injectable } from '@nestjs/common';
import { LinearService } from 'src/linear/linear.service';

@Injectable()
export class SyncService {
  constructor(private readonly linearService: LinearService) {}

  async syncData() {
    await this.linearService.getAllLinearIssues();
  }
}
