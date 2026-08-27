import { Module } from '@nestjs/common';
import { MexicanStatesController } from './mexican-states.controller';
import { MexicanStatesService } from './mexican-states.service';

@Module({
  controllers: [MexicanStatesController],
  providers: [MexicanStatesService],
  exports: [MexicanStatesService], // Necesario para sembrar desde AppModule.onApplicationBootstrap
})
export class MexicanStatesModule {}
