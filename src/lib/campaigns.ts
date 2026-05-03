import { prisma } from "@/lib/db";
import type { CampaignInput } from "@/lib/validation";
import { slugSchema } from "@/lib/validation";

export function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 80);
}

export async function createCampaign(input: CampaignInput) {
  const baseSlug = slugSchema.safeParse(input.slug ?? toSlug(input.name));

  if (!baseSlug.success) {
    throw new Error(baseSlug.error.issues[0]?.message ?? "Invalid slug.");
  }

  const slug = await getAvailableSlug(baseSlug.data);

  return prisma.campaign.create({
    data: {
      name: input.name,
      slug,
      targetUrl: input.targetUrl,
      description: input.description,
    },
  });
}

async function getAvailableSlug(slug: string) {
  const existing = await prisma.campaign.findUnique({ where: { slug } });

  if (!existing) {
    return slug;
  }

  for (let attempt = 2; attempt < 100; attempt += 1) {
    const candidate = `${slug}-${attempt}`;
    const duplicate = await prisma.campaign.findUnique({ where: { slug: candidate } });

    if (!duplicate) {
      return candidate;
    }
  }

  return `${slug}-${crypto.randomUUID().slice(0, 8)}`;
}
