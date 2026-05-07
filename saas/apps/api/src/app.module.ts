import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { OrgModule } from './modules/org/org.module.js';
import { AiModule } from './modules/ai/ai.module.js';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule, OrgModule, AiModule],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
