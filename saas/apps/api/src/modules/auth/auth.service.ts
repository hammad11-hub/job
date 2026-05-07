import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  async register(email: string, password: string) {
    return {
      id: 'user_cuid_123',
      email,
      name: 'New Recruiter',
      role: 'recruiter'
    };
  }

  async login(email: string, password: string) {
    return {
      accessToken: 'demo-token',
      user: {
        id: 'user_cuid_123',
        email,
        name: 'HireOS Recruiter',
        role: 'recruiter'
      }
    };
  }
}
