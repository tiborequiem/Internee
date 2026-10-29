import { NextRequest, NextResponse } from "next/server";
import { getPendingInternships } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secretHeader =
    request.headers.get("x-admin-secret") ||
    request.nextUrl.searchParams.get("secret") ||
    "";

  const expectedSecret = process.env.ADMIN_SECRET;
  if (!expectedSecret || secretHeader !== expectedSecret) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or missing admin passcode." },
      { status: 401 }
    );
  }

  try {
    const pending = await getPendingInternships(secretHeader);
    return NextResponse.json({ success: true, pending });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
