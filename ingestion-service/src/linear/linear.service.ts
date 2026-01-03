import { Injectable } from '@nestjs/common';
import { LinearClient } from '@linear/sdk';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LinearService {
  private client: LinearClient;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('LINEAR_API_KEY');

    if (!apiKey) {
      throw new Error('LINEAR_API_KEY is not defined');
    }

    this.client = new LinearClient({
      apiKey,
    });
  }

  async getAllLinearIssues(): Promise<void> {
    const me = await this.client.viewer;
    const myIssues = await me.assignedIssues();

    if (myIssues.nodes.length) {
      myIssues.nodes.map((issue) =>
        console.log(`${me.displayName} has issue: ${issue.title}`),
      );
    } else {
      console.log(`${me.displayName} has no issues`);
    }
  }
}
