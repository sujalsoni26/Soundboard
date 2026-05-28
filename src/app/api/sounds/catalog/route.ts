import { NextResponse } from "next/server";
import { fetchCatalogSounds } from "@/lib/catalog";

export async function GET() {
  try {
    const { sounds, source } = await fetchCatalogSounds();
    return NextResponse.json({ sounds, source });
  } catch (error) {
    console.error("GET /api/sounds/catalog", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
