import crypto from "node:crypto";
import geoip from "geoip-lite";
import { UAParser } from "ua-parser-js";
import { CONSENT_VERSION, getRetentionCutoff } from "@/lib/config";
import { prisma } from "@/lib/db";

export function getClientIp(headers: Headers) {
  const forwardedFor = headers.get("x-forwarded-for");
  const firstForwarded = forwardedFor?.split(",")[0]?.trim();
  const candidates = [
    headers.get("cf-connecting-ip"),
    headers.get("x-real-ip"),
    headers.get("x-client-ip"),
    firstForwarded,
    headers.get("forwarded")?.match(/for="?([^";,]+)"?/i)?.[1],
  ];

  return candidates.map(normalizeIp).find(Boolean) ?? null;
}

export function hashIp(ip: string | null) {
  if (!ip) {
    return null;
  }

  const salt = process.env.IP_HASH_SALT ?? process.env.AUTH_SECRET ?? "dev-ip-hash-salt";

  return crypto.createHmac("sha256", salt).update(ip).digest("base64url");
}

export function truncateIp(ip: string | null) {
  if (!ip) {
    return null;
  }

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) {
    const parts = ip.split(".");
    return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
  }

  if (ip.includes(":")) {
    return `${ip.split(":").slice(0, 4).join(":")}::`;
  }

  return null;
}

export function lookupGeo(ip: string | null) {
  if (!ip || isLocalIp(ip)) {
    return {};
  }

  const geo = geoip.lookup(ip);

  if (!geo) {
    return {};
  }

  return {
    country: geo.country || undefined,
    region: geo.region || undefined,
    city: geo.city || undefined,
    timezone: geo.timezone || undefined,
  };
}

export function summarizeUserAgent(userAgent: string | null) {
  if (!userAgent) {
    return {};
  }

  const parser = new UAParser(userAgent);
  const browser = parser.getBrowser();
  const os = parser.getOS();
  const device = parser.getDevice();
  const browserLabel = [browser.name, browser.version].filter(Boolean).join(" ");
  const osLabel = [os.name, os.version].filter(Boolean).join(" ");
  const deviceLabel = [device.vendor, device.model, device.type].filter(Boolean).join(" ");

  return {
    browser: browserLabel || undefined,
    os: osLabel || undefined,
    device: deviceLabel || "Desktop",
    userAgentSummary: [browserLabel, osLabel, deviceLabel || "Desktop"].filter(Boolean).join(" / ") || undefined,
  };
}

export async function recordClickEvent(campaignId: string, headers: Headers) {
  const ip = getClientIp(headers);
  const userAgent = headers.get("user-agent");
  const referrer = headers.get("referer") ?? headers.get("referrer") ?? undefined;

  await purgeExpiredEvents();

  return prisma.clickEvent.create({
    data: {
      campaignId,
      consentVersion: CONSENT_VERSION,
      ipHash: hashIp(ip),
      ipTruncated: truncateIp(ip),
      referrer,
      ...lookupGeo(ip),
      ...summarizeUserAgent(userAgent),
    },
  });
}

export async function purgeExpiredEvents() {
  await prisma.clickEvent.deleteMany({
    where: {
      createdAt: {
        lt: getRetentionCutoff(),
      },
    },
  });
}

function normalizeIp(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const cleaned = value.trim().replace(/^\[/, "").replace(/\]$/, "").replace(/^::ffff:/i, "");

  if (!cleaned || cleaned === "unknown") {
    return null;
  }

  return cleaned;
}

function isLocalIp(ip: string) {
  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip) ||
    ip.toLowerCase().startsWith("fc") ||
    ip.toLowerCase().startsWith("fd")
  );
}
