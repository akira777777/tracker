import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createRequestId, emitSecureLog, withSecureLogging } from "@/lib/secure-logger";
import { recordClickEvent } from "@/lib/tracking";
import { eventSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export const POST = withSecureLogging("api/events", async function POST(request: NextRequest) {
  const requestId = createRequestId(request);
  const payload = await parsePayload(request);
  const parsed = eventSchema.safeParse(payload);

  if (!parsed.success) {
    emitSecureLog({
      severity: "warn",
      source: "api/events",
      message: "Invalid tracking request rejected",
      requestId,
      activityType: "error",
      metadata: { issues: parsed.error.issues.map((issue) => issue.message) },
    });

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
    emitSecureLog({
      severity: "warn",
      source: "api/events",
      message: "Inactive or missing campaign requested",
      requestId,
      activityType: "user",
      metadata: { slug: parsed.data.slug },
    });

    return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
  }

  try {
    await recordClickEvent(campaign.id, request.headers);
    emitSecureLog({
      severity: "info",
      source: "api/events",
      message: "Campaign click recorded",
      requestId,
      activityType: "user",
      metadata: { campaignId: campaign.id, slug: parsed.data.slug },
    });
  } catch (error) {
    console.error("Click event could not be recorded", error);
    emitSecureLog({
      severity: "error",
      source: "api/events",
      message: error instanceof Error ? error.message : "Click event could not be recorded",
      requestId,
      activityType: "error",
      metadata: { campaignId: campaign.id, slug: parsed.data.slug },
    });
  }

  return NextResponse.redirect(new URL(campaign.targetUrl), { status: 303 });
});

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
