import { NextResponse } from "next/server";
import { resolveRedirectRule } from "@/lib/redirect-resolver";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");
  try {
    const redirect = await resolveRedirectRule(path);
    return NextResponse.json({ redirect });
  } catch (error) {
    console.error("Error resolving redirect:", error);
    return NextResponse.json({ redirect: null }, { status: 500 });
  }
}
