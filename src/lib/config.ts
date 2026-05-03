export const CONSENT_VERSION = "analytics-v1";

export function getRetentionDays() {
  const raw = Number.parseInt(process.env.ANALYTICS_RETENTION_DAYS ?? "30", 10);
  return Number.isFinite(raw) && raw > 0 ? raw : 30;
}

export function getRetentionCutoff() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - getRetentionDays());
  return cutoff;
}

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
