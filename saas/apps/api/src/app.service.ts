import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus() {
    return { status: 'ok', service: 'HireOS API', version: '0.1.0' };
  }
}
