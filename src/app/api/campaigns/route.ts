import { NextRequest, NextResponse } from "next/server";
import { createCampaign } from "@/lib/campaigns";
import { isAdminRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { campaignSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          events: true,
        },
      },
    },
  });

  return NextResponse.json({ campaigns });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = campaignSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid campaign." },
      { status: 400 },
    );
  }

  const campaign = await createCampaign(parsed.data);

  return NextResponse.json({ campaign }, { status: 201 });
}
