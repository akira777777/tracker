"use server";

import { revalidatePath } from "next/cache";
import { createCampaign } from "@/lib/campaigns";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
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
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Campaign data is invalid.",
    };
  }

  try {
    await createCampaign(parsed.data);
    revalidatePath("/admin");

    return {
      status: "success",
      message: "Campaign created.",
    };
  } catch (error) {
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
    return;
  }

  await prisma.campaign.update({
    where: { id },
    data: { isActive: !campaign.isActive },
  });

  revalidatePath("/admin");
}
