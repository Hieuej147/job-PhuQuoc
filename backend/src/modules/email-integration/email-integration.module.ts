import { Module } from '@nestjs/common';
import { EmailIntegrationController } from './email-integration.controller';
import { EmailIntegrationService } from './email-integration.service';

@Module({
    controllers: [EmailIntegrationController],
    providers: [EmailIntegrationService],
    exports: [EmailIntegrationService],
})
export class EmailIntegrationModule { }