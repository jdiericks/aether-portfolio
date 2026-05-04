import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    server: "real-estate-admin-mcp",
    version: "1.0.0",
    transport: "vercel-serverless",
  });
}
