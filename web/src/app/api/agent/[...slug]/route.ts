import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

/**
 * BFF Proxy: Agent → Backend API
 *
 * - Kiểm tra cookie trước khi forward
 * - Verify cookie bằng cách gọi /api/v1/auth/me
 * - Forward cookie đến backend khi gọi tool
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  return proxyRequest(request, await params);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  return proxyRequest(request, await params);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  return proxyRequest(request, await params);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  return proxyRequest(request, await params);
}

async function proxyRequest(request: NextRequest, params: { slug: string[] }) {
  const slug = params.slug || [];
  const path = slug.join("/");
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${BACKEND_URL}/api/v1/${path}${searchParams ? `?${searchParams}` : ""}`;

  // Lấy cookie từ request
  const cookie = request.headers.get("cookie") || "";

  // Debug: log cookie presence
  console.log(`[BFF Proxy] ${request.method} /${path} - cookie: ${cookie ? "YES" : "NO"}`);

  // Bước 1: Kiểm tra cookie tồn tại
  if (!cookie) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Cần đăng nhập để sử dụng trợ lý AI" },
      { status: 401 },
    );
  }

  // Bước 2: Verify cookie bằng cách gọi /api/v1/auth/me
  try {
    const verifyRes = await fetch(`${BACKEND_URL}/api/v1/auth/me`, {
      headers: { Cookie: cookie },
    });

    if (!verifyRes.ok) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Phiên đăng nhập hết hạn, vui lòng đăng nhập lại" },
        { status: 401 },
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Service Unavailable", message: "Không thể xác thực" },
      { status: 503 },
    );
  }

  // Bước 3: Cookie hợp lệ → forward request đến backend
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Cookie: cookie,
  };

  try {
    const body =
      request.method !== "GET" && request.method !== "DELETE"
        ? await request.text()
        : undefined;

    const response = await fetch(url, {
      method: request.method,
      headers,
      body,
    });

    const data = await response.text();

    return new NextResponse(data, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("content-type") || "application/json",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Backend unavailable", detail: String(error) },
      { status: 502 },
    );
  }
}
