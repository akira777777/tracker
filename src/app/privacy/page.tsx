import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f4] px-5 py-10 text-zinc-950">
      <article className="mx-auto max-w-3xl rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">
          Privacy Notice
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal">Базовая аналитика переходов</h1>
        <div className="mt-6 grid gap-4 text-sm leading-6 text-zinc-700">
          <p>
            Этот сервис фиксирует переходы по кампаниям только после нажатия кнопки продолжения на
            странице-переходнике.
          </p>
          <p>
            Сохраняются время перехода, кампания, примерная география по публичному IP, техническая
            сводка браузера, referrer, версия уведомления, хэш IP и усеченное представление IP.
            Сырой IP-адрес не хранится и не показывается в панели.
          </p>
          <p>
            География является приблизительной: страна, регион и город, если они доступны. Точные
            координаты не сохраняются.
          </p>
          <p>
            События автоматически ограничены сроком хранения из ANALYTICS_RETENTION_DAYS и по
            умолчанию хранятся 30 дней.
          </p>
        </div>
        <Link
          href="/admin"
          className="mt-6 inline-flex h-10 items-center rounded-md bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800"
        >
          В панель
        </Link>
      </article>
    </main>
  );
}
