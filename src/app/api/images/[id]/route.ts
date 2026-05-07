import { NextResponse } from "next/server";
import { ensureInitialized, getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return new NextResponse("Bad image id", { status: 400 });
  }

  try {
    await ensureInitialized();
    const { rows } = await getPool().query<{
      mime_type: string;
      data: Buffer;
      filename: string;
    }>(`SELECT mime_type, data, filename FROM images WHERE id = $1 LIMIT 1`, [id]);
    const img = rows[0];
    if (!img) {
      return new NextResponse("Not found", { status: 404 });
    }
    return new NextResponse(new Uint8Array(img.data), {
      status: 200,
      headers: {
        "Content-Type": img.mime_type || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Disposition": `inline; filename="${img.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}"`,
      },
    });
  } catch (err) {
    console.error("[api/images]", err);
    return new NextResponse("Image unavailable", { status: 500 });
  }
}
