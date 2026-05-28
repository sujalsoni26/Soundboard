import { NextResponse } from "next/server";
import { adminAuthError, requireAdminUser } from "@/lib/auth-server";
import { deleteCatalogSound, setCatalogSoundActive } from "@/lib/catalog";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdminUser();
  if ("error" in auth) return adminAuthError(auth.error);

  const { id } = await context.params;
  let body: { isActive?: boolean };
  try {
    body = (await request.json()) as { isActive?: boolean };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof body.isActive !== "boolean") {
    return NextResponse.json({ error: "isActive must be a boolean." }, { status: 400 });
  }

  try {
    const result = await setCatalogSoundActive(id, body.isActive, auth.user.id);
    return NextResponse.json({
      id,
      isActive: body.isActive,
      source: result.source,
      message: body.isActive ? "Sound is visible globally." : "Sound is hidden globally.",
    });
  } catch (error) {
    console.error("PATCH /api/admin/catalog/[id]", error);
    return NextResponse.json({ error: "Could not update sound." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireAdminUser();
  if ("error" in auth) return adminAuthError(auth.error);

  const { id } = await context.params;

  try {
    const result = await deleteCatalogSound(id);
    return NextResponse.json({
      id,
      source: result.source,
      message:
        result.source === "supabase"
          ? "Sound removed from the global catalog."
          : "Built-in sound hidden globally (cannot remove bundled files).",
    });
  } catch (error) {
    console.error("DELETE /api/admin/catalog/[id]", error);
    return NextResponse.json({ error: "Could not delete sound." }, { status: 500 });
  }
}
