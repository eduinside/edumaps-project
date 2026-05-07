import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { fetchResources } from "../../../lib/fetchResources";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await fetchResources({ forceRefresh: true });
    revalidatePath("/");
    revalidatePath("/visitmap");
    revalidatePath("/online");
    revalidatePath("/roadmap");
    return NextResponse.json({ ok: true, refreshedAt: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
