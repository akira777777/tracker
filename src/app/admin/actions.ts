"use server";

import { revalidatePath } from "next/cache";
import { createCampaign } from "@/lib/campaigns";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { emitSecureLog } from "@/lib/secure-logger";
import { campaignSchema } from "@/lib/validation";

export type CampaignFormState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function createCampaignAction(
  _state: CampaignFormState,
  formData: FormData,
): Promise<CampaignFormState> {
  await requireAdmin();

  const parsed = campaignSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    targetUrl: formData.get("targetUrl"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    emitSecureLog({
      severity: "warn",
      source: "admin/actions",
      message: "Invalid campaign form rejected",
      activityType: "user",
      metadata: { issues: parsed.error.issues.map((issue) => issue.message) },
    });

    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Campaign data is invalid.",
    };
  }

  try {
    const campaign = await createCampaign(parsed.data);
    emitSecureLog({
      severity: "info",
      source: "admin/actions",
      message: "Campaign created by admin",
      activityType: "user",
      metadata: { campaignId: campaign.id, slug: campaign.slug },
    });
    revalidatePath("/admin");

    return {
      status: "success",
      message: "Campaign created.",
    };
  } catch (error) {
    emitSecureLog({
      severity: "error",
      source: "admin/actions",
      message: error instanceof Error ? error.message : "Campaign could not be created",
      activityType: "error",
    });

    return {
      status: "error",
      message: error instanceof Error ? error.message : "Campaign could not be created.",
    };
  }
}

export async function toggleCampaignAction(id: string) {
  await requireAdmin();

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    select: { isActive: true },
  });

  if (!campaign) {
    emitSecureLog({
      severity: "warn",
      source: "admin/actions",
      message: "Campaign toggle requested for missing campaign",
      activityType: "user",
      metadata: { campaignId: id },
    });

    return;
  }

  await prisma.campaign.update({
    where: { id },
    data: { isActive: !campaign.isActive },
  });

  emitSecureLog({
    severity: "info",
    source: "admin/actions",
    message: "Campaign status toggled by admin",
    activityType: "user",
    metadata: { campaignId: id, isActive: !campaign.isActive },
  });

  revalidatePath("/admin");
}
