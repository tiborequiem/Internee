import { NextRequest, NextResponse } from "next/server";
import { getPublicInternships } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sector = searchParams.get("sector") || undefined;
  const category = searchParams.get("category") || undefined;
  const location = searchParams.get("location") || undefined;
  const status = searchParams.get("status") || undefined;
  const search = searchParams.get("search") || undefined;

  try {
    const list = await getPublicInternships({
      sector,
      category,
      location,
      status,
      search,
    });
    return NextResponse.json(list);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
