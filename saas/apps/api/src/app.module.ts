import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { OrgModule } from './modules/org/org.module';
import { AiModule } from './modules/ai/ai.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule, OrgModule, AiModule],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
