import { Controller, Post, Body, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from './decorators/public.decorator';
import { Response } from 'express';

@ApiTags('Auth')
@Controller('scalar-auth')
export class ScalarAuthController {
  private readonly AUTH_URL = process.env.BETTER_AUTH_URL || 'http://localhost:3000';

  @Post('login')
  @Public()
  @ApiOperation({
    summary: 'Đăng nhập (Scalar)',
    description: 'Proxy endpoint cho Scalar docs. Gọi better-auth sign-in và trả về session cookie. Chỉ dùng trên Scalar UI.',
  })
  @ApiResponse({ status: 200, description: 'Đăng nhập thành công, session cookie đã set' })
  @ApiResponse({ status: 401, description: 'Sai email hoặc password' })
  async login(
    @Body() body: { email: string; password: string },
    @Res() res: Response,
  ) {
    try {
      const response = await fetch(`${this.AUTH_URL}/api/auth/sign-in/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': this.AUTH_URL,
        },
        body: JSON.stringify(body),
      });

      // Forward Set-Cookie headers
      const setCookies = response.headers.getSetCookie();
      for (const cookie of setCookies) {
        res.append('Set-Cookie', cookie);
      }

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      res.status(500).json({ message: 'Auth service unavailable' });
    }
  }

  @Post('register')
  @Public()
  @ApiOperation({
    summary: 'Đăng ký (Scalar)',
    description: 'Proxy endpoint cho Scalar docs. Gọi better-auth sign-up. Chỉ dùng trên Scalar UI.',
  })
  @ApiResponse({ status: 200, description: 'Đăng ký thành công' })
  @ApiResponse({ status: 422, description: 'Email đã tồn tại' })
  async register(
    @Body() body: { name: string; email: string; password: string; role?: string },
    @Res() res: Response,
  ) {
    try {
      const response = await fetch(`${this.AUTH_URL}/api/auth/sign-up/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': this.AUTH_URL,
        },
        body: JSON.stringify(body),
      });

      // Forward Set-Cookie headers
      const setCookies = response.headers.getSetCookie();
      for (const cookie of setCookies) {
        res.append('Set-Cookie', cookie);
      }

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      res.status(500).json({ message: 'Auth service unavailable' });
    }
  }

  @Post('logout')
  @Public()
  @ApiOperation({
    summary: 'Đăng xuất (Scalar)',
    description: 'Proxy endpoint cho Scalar docs. Xóa session cookie. Chỉ dùng trên Scalar UI.',
  })
  @ApiResponse({ status: 200, description: 'Đăng xuất thành công' })
  async logout(@Res() res: Response) {
    try {
      const response = await fetch(`${this.AUTH_URL}/api/auth/sign-out`, {
        method: 'POST',
        headers: {
          'Origin': this.AUTH_URL,
        },
      });

      // Clear cookies
      const setCookies = response.headers.getSetCookie();
      for (const cookie of setCookies) {
        res.append('Set-Cookie', cookie);
      }

      res.status(200).json({ message: 'Logged out' });
    } catch (error) {
      res.status(500).json({ message: 'Auth service unavailable' });
    }
  }
}
