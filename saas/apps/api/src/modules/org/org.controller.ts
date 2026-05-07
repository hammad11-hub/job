import { Controller, Get } from '@nestjs/common';
import { OrgService } from './org.service.js';

@Controller('org')
export class OrgController {
  constructor(private readonly orgService: OrgService) {}

  @Get('me')
  async getOrg() {
    return this.orgService.getOrganization();
  }
}
