import { Controller, Get, Post, Delete, Query, Body, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Response } from 'express';
import { EmailIntegrationService } from './email-integration.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { SendEmailDto } from './dto/send-email.dto';
import type { UserSession } from '@thallesp/nestjs-better-auth';

@ApiTags('Email Integration')
@Controller('email-integration')
export class EmailIntegrationController {
    constructor(private readonly emailIntegrationService: EmailIntegrationService) { }

    @Get('status')
    @ApiBearerAuth('better-auth.session_token')
    @ApiOperation({ summary: 'Kiểm tra đã kết nối Gmail chưa', description: 'Trả về { connected, email? } cho user hiện tại.' })
    getStatus(@CurrentUser() user: UserSession) {
        return this.emailIntegrationService.getStatus(user.user.id);
    }

    @Get('authorize')
    @ApiBearerAuth('better-auth.session_token')
    @ApiOperation({ summary: 'Lấy URL để bắt đầu kết nối Gmail', description: 'FE redirect trình duyệt tới URL trả về để mở màn hình cấp quyền của Google.' })
    authorize(@CurrentUser() user: UserSession) {
        return { url: this.emailIntegrationService.buildAuthorizeUrl(user.user.id) };
    }

    @Get('callback')
    @Public()
    @ApiExcludeEndpoint() // Route kỹ thuật do Google gọi lại, không phải API cho FE tự gọi trực tiếp.
    async callback(
        @Query('code') code: string,
        @Query('state') state: string,
        @Query('error') error: string | undefined,
        @Res() res: Response,
    ) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
        const settingsUrl = `${frontendUrl}/employer/settings`;

        if (error || !code || !state) {
            return res.redirect(`${settingsUrl}?email_connect_error=1`);
        }

        try {
            await this.emailIntegrationService.handleCallback(code, state);
            return res.redirect(`${settingsUrl}?email_connected=1`);
        } catch {
            return res.redirect(`${settingsUrl}?email_connect_error=1`);
        }
    }

    @Delete()
    @ApiBearerAuth('better-auth.session_token')
    @ApiOperation({ summary: 'Ngắt kết nối Gmail' })
    disconnect(@CurrentUser() user: UserSession) {
        return this.emailIntegrationService.disconnect(user.user.id);
    }

    @Post('send')
    @ApiBearerAuth('better-auth.session_token')
    @ApiOperation({ summary: 'Gửi email thật qua Gmail của user hiện tại', description: 'Cần đã kết nối Gmail trước (xem /email-integration/authorize).' })
    send(@CurrentUser() user: UserSession, @Body() body: SendEmailDto) {
        return this.emailIntegrationService.sendEmail(user.user.id, body.to, body.subject, body.body);
    }
}