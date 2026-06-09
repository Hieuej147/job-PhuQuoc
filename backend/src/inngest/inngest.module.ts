import { Global, Module } from '@nestjs/common';
import { InngestService } from './inngest.service';
import { InngestController } from './inngest.controller';

@Global()
@Module({
  controllers: [InngestController],
  providers: [InngestService],
  exports: [InngestService],
})
export class InngestModule {}
