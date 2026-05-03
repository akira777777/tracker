import { BarChart3, ExternalLink, LogOut, Pause, Play, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { toggleCampaignAction } from "@/app/admin/actions";
import { AdminLogStream } from "@/components/admin-log-stream";
import { logoutAction } from "@/app/login/actions";
import { CampaignForm } from "@/components/campaign-form";
import { CopyLink } from "@/components/copy-link";
import { requireAdmin } from "@/lib/auth";
import { getAppUrl, getRetentionCutoff, getRetentionDays } from "@/lib/config";
import { prisma } from "@/lib/db";
import { purgeExpiredEvents } from "@/lib/tracking";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  await purgeExpiredEvents();

  const appUrl = getAppUrl().replace(/\/$/, "");
  const cutoff = getRetentionCutoff();
  const retentionDays = getRetentionDays();

  const [campaigns, campaignCounts, countryCounts, recentEvents, totalEvents] = await Promise.all([
    prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
    }),
    prisma.clickEvent.groupBy({
      by: ["campaignId"],
      where: { createdAt: { gte: cutoff } },
      _count: { _all: true },
    }),
    prisma.clickEvent.groupBy({
      by: ["country"],
      where: {
        createdAt: { gte: cutoff },
        country: { not: null },
      },
      _count: { _all: true },
    }),
    prisma.clickEvent.findMany({
      where: { createdAt: { gte: cutoff } },
      include: {
        campaign: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.clickEvent.count({
      where: { createdAt: { gte: cutoff } },
    }),
  ]);

  const countsByCampaign = new Map(
    campaignCounts.map((item) => [item.campaignId, item._count._all]),
  );
  const topCountries = countryCounts.sort((a, b) => b._count._all - a._count._all).slice(0, 8);
  const activeCampaigns = campaigns.filter((campaign) => campaign.isActive).length;

  return (
    <main className="min-h-screen bg-[#f7f7f4] text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">
              Transparent Analytics
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal">Трекер переходов</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/privacy"
              className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-300 px-3 text-sm text-zinc-700 transition hover:border-zinc-500 hover:text-zinc-950"
            >
              <ShieldCheck aria-hidden size={16} />
              Privacy
            </Link>
            <form action={logoutAction}>
              <button className="inline-flex h-9 items-center gap-2 rounded-md bg-zinc-950 px-3 text-sm font-medium text-white transition hover:bg-zinc-800">
                <LogOut aria-hidden size={16} />
                Выйти
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6">
        <section className="grid gap-4 md:grid-cols-3">
          <Metric
            label="Кампании"
            value={campaigns.length.toString()}
            detail={`${activeCampaigns} active`}
          />
          <Metric
            label="Переходы"
            value={totalEvents.toString()}
            detail={`за ${retentionDays} дней`}
          />
          <Metric label="Гео" value={topCountries.length.toString()} detail="страны в событиях" />
        </section>

        <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <BarChart3 aria-hidden className="text-emerald-700" size={18} />
              <h2 className="text-lg font-semibold">Новая кампания</h2>
            </div>
            <CampaignForm />
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 px-5 py-4">
              <h2 className="text-lg font-semibold">Кампании</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Публичная ссылка ведет на страницу с компактным уведомлением и кнопкой продолжения.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Название</th>
                    <th className="px-5 py-3 font-medium">Ссылка</th>
                    <th className="px-5 py-3 font-medium">Переходы</th>
                    <th className="px-5 py-3 font-medium">Статус</th>
                    <th className="px-5 py-3 font-medium">Действие</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {campaigns.length ? (
                    campaigns.map((campaign) => {
                      const trackingUrl = `${appUrl}/t/${campaign.slug}`;
                      const targetHost = getHost(campaign.targetUrl);
                      const toggleCampaign = toggleCampaignAction.bind(null, campaign.id);

                      return (
                        <tr key={campaign.id} className="align-top">
                          <td className="px-5 py-4">
                            <div className="font-medium text-zinc-950">{campaign.name}</div>
                            {campaign.description ? (
                              <div className="mt-1 max-w-xs text-xs text-zinc-500">
                                {campaign.description}
                              </div>
                            ) : null}
                            <a
                              href={campaign.targetUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900"
                            >
                              {targetHost}
                              <ExternalLink aria-hidden size={12} />
                            </a>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <code className="rounded bg-zinc-100 px-2 py-1 text-xs text-zinc-700">
                                /t/{campaign.slug}
                              </code>
                              <CopyLink value={trackingUrl} />
                            </div>
                            <a
                              href={trackingUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-900"
                            >
                              Открыть переходник
                              <ExternalLink aria-hidden size={12} />
                            </a>
                          </td>
                          <td className="px-5 py-4 text-zinc-800">
                            {countsByCampaign.get(campaign.id) ?? 0}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={
                                campaign.isActive
                                  ? "rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800"
                                  : "rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600"
                              }
                            >
                              {campaign.isActive ? "active" : "paused"}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <form action={toggleCampaign}>
                              <button className="inline-flex h-8 items-center gap-2 rounded-md border border-zinc-300 px-3 text-xs font-medium text-zinc-700 transition hover:border-zinc-500 hover:text-zinc-950">
                                {campaign.isActive ? (
                                  <Pause aria-hidden size={14} />
                                ) : (
                                  <Play aria-hidden size={14} />
                                )}
                                {campaign.isActive ? "Пауза" : "Включить"}
                              </button>
                            </form>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-sm text-zinc-500">
                        Кампаний пока нет.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Грубая география</h2>
            <div className="mt-4 grid gap-2">
              {topCountries.length ? (
                topCountries.map((item) => (
                  <div
                    key={item.country}
                    className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2"
                  >
                    <span className="text-sm text-zinc-700">{item.country}</span>
                    <span className="text-sm font-medium text-zinc-950">{item._count._all}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-500">
                  Геоданные появятся после переходов с публичных IP.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Последние события</h2>
            <div className="mt-4 grid gap-3">
              {recentEvents.length ? (
                recentEvents.map((event) => (
                  <div key={event.id} className="rounded-md border border-zinc-100 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-zinc-900">{event.campaign.name}</span>
                      <time className="text-xs text-zinc-500">{formatDate(event.createdAt)}</time>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      {[event.city, event.region, event.country].filter(Boolean).join(", ") ||
                        "Geo unavailable"}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {event.userAgentSummary || "Browser unavailable"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-500">Событий пока нет.</p>
              )}
            </div>
          </div>
        </section>

        <AdminLogStream />
      </div>
    </main>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-zinc-500">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-4">
        <span className="text-3xl font-semibold tracking-normal">{value}</span>
        <span className="text-sm text-zinc-500">{detail}</span>
      </div>
    </div>
  );
}

function getHost(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ru", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
