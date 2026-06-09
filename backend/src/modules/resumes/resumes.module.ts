import { Module } from '@nestjs/common';
import { ResumesController } from './resumes.controller';
import { ResumesService } from './resumes.service';
import { TemplateValidatorService } from './template-validator.service';
import { TemplateEngineService } from './template-engine.service';

@Module({
  controllers: [ResumesController],
  providers: [ResumesService, TemplateValidatorService, TemplateEngineService],
  exports: [ResumesService, TemplateValidatorService, TemplateEngineService],
})
export class ResumesModule {}
