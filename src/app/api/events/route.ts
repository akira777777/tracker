import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { recordClickEvent } from "@/lib/tracking";
import { eventSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const payload = await parsePayload(request);
  const parsed = eventSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid tracking request." }, { status: 400 });
  }

  const campaign = await prisma.campaign.findUnique({
    where: { slug: parsed.data.slug },
    select: {
      id: true,
      targetUrl: true,
      isActive: true,
    },
  });

  if (!campaign || !campaign.isActive) {
    return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
  }

  try {
    await recordClickEvent(campaign.id, request.headers);
  } catch (error) {
    console.error("Click event could not be recorded", error);
  }

  return NextResponse.redirect(new URL(campaign.targetUrl), { status: 303 });
}

async function parsePayload(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return request.json();
  }

  const formData = await request.formData();

  return {
    slug: formData.get("slug"),
  };
}
