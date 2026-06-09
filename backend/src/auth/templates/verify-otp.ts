export function verifyOtpTemplate(otp: string): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0">
    <tr>
      <td align="center">
        <table width="500" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;padding:32px;max-width:500px">
          <tr>
            <td>
              <h2 style="margin:0 0 16px;color:#1a1a1a;font-size:24px">Xác nhận email</h2>
              <p style="margin:0 0 24px;color:#333;font-size:16px;line-height:24px">
                Cảm ơn bạn đã đăng ký. Mã OTP xác nhận email của bạn:
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px">
                <tr>
                  <td align="center" style="background:#f0f0f0;border-radius:6px;padding:20px">
                    <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#1a1a1a">${otp}</span>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;color:#666;font-size:14px;line-height:20px">
                Mã có hiệu lực trong <strong>5 phút</strong>.
              </p>
              <p style="margin:0 0 24px;color:#666;font-size:14px;line-height:20px">
                Không chia sẻ mã này cho bất kỳ ai.
              </p>

              <hr style="border:none;border-top:1px solid #eee;margin:24px 0">

              <p style="margin:0;color:#999;font-size:12px;line-height:16px">
                Nếu bạn không tạo tài khoản, vui lòng bỏ qua email này.
              </p>
              <p style="margin:8px 0 0;color:#999;font-size:12px;line-height:16px">
                Phú Quốc Jobs
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
