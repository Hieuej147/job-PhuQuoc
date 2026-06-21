import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:3000" || "http://localhost:3000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await params;
  const path = slug ? `/${slug.join("/")}` : "";
  const url = new URL(request.url);
  const backendUrl = `${BACKEND_URL}/api/auth${path}${url.search}`;

  try {
    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        ...Object.fromEntries(
          Array.from(request.headers.entries()).filter(
            ([key]) => !key.startsWith("x-forwarded") && key !== "host",
          ),
        ),
      },
      credentials: "include",
    });

    const data = await response.text();
    const nextResponse = new NextResponse(data, {
      status: response.status,
      statusText: response.statusText,
    });

    // Forward Set-Cookie headers
    const setCookies = response.headers.getSetCookie();
    for (const cookie of setCookies) {
      nextResponse.headers.append("Set-Cookie", cookie);
    }

    return nextResponse;
  } catch (error) {
    console.error("Auth proxy error:", error);
    return NextResponse.json(
      { error: "Proxy error" },
      { status: 502 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await params;
  const path = slug ? `/${slug.join("/")}` : "";
  const url = new URL(request.url);
  const backendUrl = `${BACKEND_URL}/api/auth${path}${url.search}`;

  try {
    const body = await request.text();
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        ...Object.fromEntries(
          Array.from(request.headers.entries()).filter(
            ([key]) =>
              !key.startsWith("x-forwarded") &&
              key !== "host" &&
              key !== "content-length",
          ),
        ),
      },
      body,
      credentials: "include",
    });

    const data = await response.text();
    const nextResponse = new NextResponse(data, {
      status: response.status,
      statusText: response.statusText,
    });

    // Forward Set-Cookie headers
    const setCookies = response.headers.getSetCookie();
    for (const cookie of setCookies) {
      nextResponse.headers.append("Set-Cookie", cookie);
    }

    return nextResponse;
  } catch (error) {
    console.error("Auth proxy error:", error);
    return NextResponse.json(
      { error: "Proxy error" },
      { status: 502 },
    );
  }
}
