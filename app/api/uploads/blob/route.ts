import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { put } from "@vercel/blob";
import { authOptions } from "@/lib/auth";

const MAX_UPLOAD_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB
const ALLOWED_PREFIXES = ["image/", "video/"];

function sanitizeFilename(filename: string) {
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120);
  return sanitized || "upload";
}

function sanitizeFolder(folder: FormDataEntryValue | null) {
  if (typeof folder !== "string" || !folder.trim()) {
    return "uploads";
  }

  return folder
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9/_-]+/g, "-")
    .replace(/^\/+|\/+$/g, "")
    .slice(0, 80) || "uploads";
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    if (!ALLOWED_PREFIXES.some((prefix) => file.type.startsWith(prefix))) {
      return NextResponse.json(
        { error: "Only image and video files are allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      return NextResponse.json({ error: "File is too large" }, { status: 400 });
    }

    const folder = sanitizeFolder(formData.get("folder"));
    const safeFilename = sanitizeFilename(file.name);
    const blob = await put(`${folder}/${Date.now()}-${safeFilename}`, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type,
    });

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
      contentType: file.type,
      filename: safeFilename,
    });
  } catch (error) {
    console.error("Error uploading blob:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
