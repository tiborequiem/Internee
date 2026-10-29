import { NextRequest, NextResponse } from "next/server";
import { submitCommunityInternship } from "@/lib/queries";
import { isStrictEgyptInternship } from "@/lib/internship-filter";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyName, title, applicationUrl, category, location } = body;

    if (!companyName || !title || !applicationUrl || !category || !location) {
      return NextResponse.json(
        { error: "All fields are required (companyName, title, applicationUrl, category, location)." },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(applicationUrl);
    } catch {
      return NextResponse.json(
        { error: "Invalid application URL format. Must be a valid http/https link." },
        { status: 400 }
      );
    }

    // Enforce strict internship filter on community submissions as well
    if (!isStrictEgyptInternship(title, location)) {
      return NextResponse.json(
        {
          error:
            "Submission does not meet Egyptian student internship guidelines. Title must refer to an internship/trainee/graduate/academy role located in Egypt, and must not be a full-time, junior, or senior position.",
        },
        { status: 422 }
      );
    }

    const created = await submitCommunityInternship({
      companyName,
      title,
      applicationUrl,
      category,
      location,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Internship submitted successfully! It is pending admin review.",
        data: created,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Community submission error:", err);
    return NextResponse.json(
      { error: "Failed to submit internship.", details: err.message },
      { status: 500 }
    );
  }
}
