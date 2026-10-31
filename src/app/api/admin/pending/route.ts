import { NextRequest, NextResponse } from "next/server";
import { getPendingInternships } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secretHeader =
    request.headers.get("x-admin-secret") ||
    request.nextUrl.searchParams.get("secret") ||
    "";

  const expectedSecret =
    process.env.ADMIN_SECRET?.trim().replace(/^["']|["']$/g, "") ||
    "admin_9dec72da5efd7120236f309ceb8f8537";

  const cleanSecret = secretHeader.trim().replace(/^["']|["']$/g, "");
  if (!expectedSecret || cleanSecret !== expectedSecret) {
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
