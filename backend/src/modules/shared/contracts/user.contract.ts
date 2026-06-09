import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export interface UserContract {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  image: string | null;
}

@Injectable()
export class UserContractService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<UserContract | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
      },
    });
  }
}
