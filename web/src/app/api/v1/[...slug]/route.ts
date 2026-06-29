import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

async function proxyRequest(request: NextRequest, slug: string[]) {
  const path = slug ? `/${slug.join("/")}` : "";
  const url = new URL(request.url);
  const backendUrl = `${BACKEND_URL}/api/v1${path}${url.search}`;

  try {
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      if (!key.startsWith("x-forwarded") && key !== "host") {
        headers.set(key, value);
      }
    });

    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
      credentials: "include",
    };

    if (["POST", "PUT", "PATCH"].includes(request.method)) {
      fetchOptions.body = await request.arrayBuffer();
    }

    const response = await fetch(backendUrl, fetchOptions);
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
    console.error("API proxy error:", error);
    return NextResponse.json({ error: "Proxy error" }, { status: 502 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await params;
  return proxyRequest(request, slug);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await params;
  return proxyRequest(request, slug);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await params;
  return proxyRequest(request, slug);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await params;
  return proxyRequest(request, slug);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await params;
  return proxyRequest(request, slug);
}
