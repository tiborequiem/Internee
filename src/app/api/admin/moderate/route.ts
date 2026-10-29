import { NextRequest, NextResponse } from "next/server";
import { moderateInternship } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action, adminSecret } = body;

    const secret =
      adminSecret ||
      request.headers.get("x-admin-secret") ||
      "";

    if (!id || !action) {
      return NextResponse.json(
        { error: "Missing required fields (id, action)." },
        { status: 400 }
      );
    }

    if (!["approve", "reject", "close"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve', 'reject', or 'close'." },
        { status: 400 }
      );
    }

    const updated = await moderateInternship(Number(id), action, secret);
    return NextResponse.json({
      success: true,
      message: `Internship #${id} successfully marked as ${action}d.`,
      internship: updated,
    });
  } catch (err: any) {
    if (err.message.includes("Unauthorized")) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
