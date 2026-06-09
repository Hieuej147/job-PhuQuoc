import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseCuidPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!value || !/^[a-z0-9]{20,30}$/.test(value)) {
      throw new BadRequestException(`"${value}" is not a valid CUID`);
    }
    return value;
  }
}
