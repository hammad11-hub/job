import { Controller, Get } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('match/demo')
  async getMatchDemo() {
    return this.aiService.getMatchSummary();
  }
}
