import { Injectable } from '@nestjs/common';

@Injectable()
export class OrgService {
  async getOrganization() {
    return {
      id: 'org_cuid_123',
      name: 'HireOS Labs',
      slug: 'hireos-labs',
      plan: 'pro'
    };
  }
}
