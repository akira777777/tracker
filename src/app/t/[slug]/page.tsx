import { ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function TrackingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { slug },
  });

  if (!campaign || !campaign.isActive) {
    notFound();
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#f7f7f4] px-5 py-5 text-zinc-950">
      <section className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-md bg-emerald-50 text-emerald-800">
            <ArrowRight aria-hidden size={20} />
          </div>
          <p className="text-sm text-zinc-500">Переход по ссылке</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-normal">{campaign.name}</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            Вы будете перенаправлены на <span className="font-medium text-zinc-950">{getHost(campaign.targetUrl)}</span>.
          </p>

          <form action="/api/events" method="post" className="mt-6">
            <input type="hidden" name="slug" value={campaign.slug} />
            <button className="inline-flex h-10 items-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800">
              Продолжить
              <ArrowRight aria-hidden size={16} />
            </button>
          </form>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-xl items-start gap-2 pb-2 text-[12px] leading-5 text-zinc-500">
        <ShieldCheck aria-hidden className="mt-0.5 shrink-0 text-emerald-700" size={14} />
        <p>
          Мы используем базовую аналитику переходов: время, примерное местоположение и
          технические данные браузера.{" "}
          <Link href="/privacy" className="font-medium text-zinc-700 underline underline-offset-2">
            Подробнее
          </Link>
        </p>
      </footer>
    </main>
  );
}

function getHost(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}
