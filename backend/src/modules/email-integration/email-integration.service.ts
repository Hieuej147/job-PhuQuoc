import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GMAIL_SEND_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

// Refresh access token sớm hơn 60s so với hạn thật, tránh trường hợp token
// hết hạn ngay giữa lúc đang gọi Gmail API (race điều kiện thời gian).
const TOKEN_REFRESH_SKEW_MS = 60_000;

// State chỉ có hiệu lực trong 10 phút — đủ thời gian cho user thao tác trên
// màn hình consent của Google, nhưng đủ ngắn để hạn chế rủi ro nếu URL bị lộ.
const STATE_MAX_AGE_MS = 10 * 60 * 1000;

interface StatePayload {
    userId: string;
    ts: number;
}

@Injectable()
export class EmailIntegrationService {
    constructor(private readonly prisma: PrismaService) { }

    private get redirectUri(): string {
        // Cố định theo đúng URI đã khai báo trên Google Cloud Console — không lấy
        // từ BACKEND_URL nội bộ, tránh Google từ chối vì URI không khớp. Trong
        // topology hiện tại callback public đi qua Nginx ở port 80.
        const publicBackendUrl = process.env.BACKEND_PUBLIC_URL || process.env.BETTER_AUTH_URL || 'http://localhost';
        return `${publicBackendUrl.replace(/\/$/, '')}/api/v1/email-integration/callback`;
    }

    private get clientId(): string {
        const id = process.env.GOOGLE_CLIENT_ID;
        if (!id) throw new InternalServerErrorException('GOOGLE_CLIENT_ID chưa được cấu hình');
        return id;
    }

    private get clientSecret(): string {
        const secret = process.env.GOOGLE_CLIENT_SECRET;
        if (!secret) throw new InternalServerErrorException('GOOGLE_CLIENT_SECRET chưa được cấu hình');
        return secret;
    }

    /**
     * Ký `state` bằng HMAC-SHA256 (dùng chung BETTER_AUTH_SECRET đã có sẵn của
     * dự án) để xác định CHÍNH XÁC user nào đang thực hiện OAuth khi Google gọi
     * lại callback — bước callback không có cookie session (request đến từ
     * Google, không phải từ trình duyệt user với cookie của app), nên không thể
     * dùng @CurrentUser() ở đó. State ký kiểu này không thể giả mạo được vì
     * không biết BETTER_AUTH_SECRET.
     */
    private signState(payload: StatePayload): string {
        const secret = process.env.BETTER_AUTH_SECRET || '';
        const json = JSON.stringify(payload);
        const payloadB64 = Buffer.from(json).toString('base64url');
        const signature = crypto.createHmac('sha256', secret).update(payloadB64).digest('hex');
        return `${payloadB64}.${signature}`;
    }

    private verifyState(state: string): StatePayload {
        const secret = process.env.BETTER_AUTH_SECRET || '';
        const [payloadB64, signature] = (state || '').split('.');
        if (!payloadB64 || !signature) {
            throw new BadRequestException('State không hợp lệ');
        }
        const expectedSignature = crypto.createHmac('sha256', secret).update(payloadB64).digest('hex');
        const sigBuf = Buffer.from(signature, 'hex');
        const expectedBuf = Buffer.from(expectedSignature, 'hex');
        if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
            throw new BadRequestException('State không hợp lệ hoặc đã bị thay đổi');
        }
        const payload: StatePayload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
        if (Date.now() - payload.ts > STATE_MAX_AGE_MS) {
            throw new BadRequestException('Phiên kết nối Gmail đã hết hạn, vui lòng thử lại');
        }
        return payload;
    }

    buildAuthorizeUrl(userId: string): string {
        const state = this.signState({ userId, ts: Date.now() });
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            response_type: 'code',
            // access_type=offline + prompt=consent để LUÔN nhận được refresh_token
            // (mặc định Google chỉ trả refresh_token ở lần cấp quyền đầu tiên).
            access_type: 'offline',
            prompt: 'consent',
            scope: [
                'https://www.googleapis.com/auth/gmail.send',
                'https://www.googleapis.com/auth/userinfo.email',
            ].join(' '),
            state,
        });
        return `${GOOGLE_AUTH_URL}?${params.toString()}`;
    }

    async handleCallback(code: string, state: string): Promise<{ userId: string }> {
        const { userId } = this.verifyState(state);

        const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: this.clientId,
                client_secret: this.clientSecret,
                redirect_uri: this.redirectUri,
                grant_type: 'authorization_code',
            }),
        });

        if (!tokenResponse.ok) {
            const detail = await tokenResponse.text();
            throw new BadRequestException(`Không thể đổi mã xác thực Google: ${detail}`);
        }

        const tokenData = (await tokenResponse.json()) as {
            access_token: string;
            refresh_token?: string;
            expires_in: number;
            scope: string;
        };

        const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        if (!userInfoResponse.ok) {
            throw new BadRequestException('Không thể lấy thông tin email từ Google');
        }
        const userInfo = (await userInfoResponse.json()) as { email: string };

        const accessTokenExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

        // Nếu lần này Google không trả refresh_token (hiếm, vì đã ép prompt=consent),
        // giữ nguyên refresh_token cũ đã lưu trước đó thay vì ghi đè thành rỗng.
        const existing = await this.prisma.emailIntegration.findUnique({ where: { userId } });

        await this.prisma.emailIntegration.upsert({
            where: { userId },
            update: {
                email: userInfo.email,
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token || existing?.refreshToken || null,
                accessTokenExpiresAt,
                scope: tokenData.scope,
            },
            create: {
                userId,
                email: userInfo.email,
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token || null,
                accessTokenExpiresAt,
                scope: tokenData.scope,
            },
        });

        return { userId };
    }

    async getStatus(userId: string): Promise<{ connected: boolean; email?: string }> {
        const integration = await this.prisma.emailIntegration.findUnique({ where: { userId } });
        if (!integration) return { connected: false };
        return { connected: true, email: integration.email };
    }

    async disconnect(userId: string): Promise<{ message: string }> {
        await this.prisma.emailIntegration
            .delete({ where: { userId } })
            .catch(() => null); // Không sao nếu vốn dĩ chưa từng kết nối.
        return { message: 'Đã ngắt kết nối Gmail' };
    }

    /**
     * Trả về access token còn hiệu lực, tự refresh nếu đã hết hạn (hoặc sắp hết
     * hạn trong TOKEN_REFRESH_SKEW_MS). Đây là hàm DUY NHẤT các nơi khác nên
     * gọi để lấy access token — không đọc thẳng accessToken từ DB.
     */
    private async getValidAccessToken(userId: string): Promise<string> {
        const integration = await this.prisma.emailIntegration.findUnique({ where: { userId } });
        if (!integration) {
            throw new NotFoundException(
                'Bạn chưa kết nối Gmail. Vui lòng vào Cài đặt để kết nối trước khi gửi email.',
            );
        }

        const isExpiringSoon =
            !integration.accessTokenExpiresAt ||
            integration.accessTokenExpiresAt.getTime() - Date.now() < TOKEN_REFRESH_SKEW_MS;

        if (!isExpiringSoon) {
            return integration.accessToken;
        }

        if (!integration.refreshToken) {
            throw new BadRequestException(
                'Phiên kết nối Gmail đã hết hạn và không thể tự làm mới. Vui lòng kết nối lại Gmail trong Cài đặt.',
            );
        }

        const refreshResponse = await fetch(GOOGLE_TOKEN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: this.clientId,
                client_secret: this.clientSecret,
                refresh_token: integration.refreshToken,
                grant_type: 'refresh_token',
            }),
        });

        if (!refreshResponse.ok) {
            throw new BadRequestException(
                'Không thể làm mới quyền truy cập Gmail. Vui lòng kết nối lại Gmail trong Cài đặt.',
            );
        }

        const refreshed = (await refreshResponse.json()) as { access_token: string; expires_in: number };
        const accessTokenExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000);

        await this.prisma.emailIntegration.update({
            where: { userId },
            data: { accessToken: refreshed.access_token, accessTokenExpiresAt },
        });

        return refreshed.access_token;
    }

    /**
     * Encode header Subject theo RFC 2047 (=?UTF-8?B?...?=) để tiếng Việt có
     * dấu hiển thị đúng trên mọi mail client — header thô chỉ chấp nhận ASCII.
     */
    private encodeSubject(subject: string): string {
        return `=?UTF-8?B?${Buffer.from(subject, 'utf8').toString('base64')}?=`;
    }

    /** base64 chuẩn MIME, xuống dòng mỗi 76 ký tự theo RFC 2045. */
    private base64Wrap(input: string): string {
        const b64 = Buffer.from(input, 'utf8').toString('base64');
        return b64.replace(/.{76}/g, '$&\r\n');
    }

    /**
     * Rút gọn HTML thành bản text thuần để đính kèm trong multipart/alternative
     * — bắt buộc theo chuẩn MIME cho mọi mail client/spam filter đọc được kể cả
     * khi không render HTML (một số bộ lọc spam đánh giá thấp email chỉ có
     * text/html mà thiếu bản text/plain đi kèm).
     */
    private stripHtml(html: string): string {
        return html
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n\n')
            .replace(/<\/tr>/gi, '\n')
            .replace(/<\/li>/gi, '\n')
            .replace(/<li[^>]*>/gi, '- ')
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    /**
     * Build MIME dạng multipart/alternative gồm cả bản text/plain (rút gọn tự
     * động từ HTML) lẫn bản text/html — chuẩn khuyến nghị cho email giao dịch,
     * giúp mail client cũ và bộ lọc spam vẫn đọc được, đồng thời hiển thị đẹp
     * trên client hỗ trợ HTML.
     */
    private buildRawMessage(to: string, subject: string, htmlBody: string): string {
        const boundary = `----=_PQJobs_${crypto.randomBytes(12).toString('hex')}`;
        const plainText = this.stripHtml(htmlBody);

        const mime = [
            `To: ${to}`,
            `Subject: ${this.encodeSubject(subject)}`,
            'MIME-Version: 1.0',
            `Content-Type: multipart/alternative; boundary="${boundary}"`,
            '',
            `--${boundary}`,
            'Content-Type: text/plain; charset="UTF-8"',
            'Content-Transfer-Encoding: base64',
            '',
            this.base64Wrap(plainText),
            '',
            `--${boundary}`,
            'Content-Type: text/html; charset="UTF-8"',
            'Content-Transfer-Encoding: base64',
            '',
            this.base64Wrap(htmlBody),
            '',
            `--${boundary}--`,
        ].join('\r\n');

        return Buffer.from(mime, 'utf8')
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    }

    async sendEmail(userId: string, to: string, subject: string, body: string): Promise<{ messageId: string }> {
        const accessToken = await this.getValidAccessToken(userId);
        const raw = this.buildRawMessage(to, subject, body);

        const response = await fetch(GMAIL_SEND_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ raw }),
        });

        if (!response.ok) {
            const detail = await response.text();
            throw new BadRequestException(`Gửi email thất bại: ${detail}`);
        }

        const data = (await response.json()) as { id: string };
        return { messageId: data.id };
    }
}
