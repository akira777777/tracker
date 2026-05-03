import { LockKeyhole } from "lucide-react";
import { loginAction } from "@/app/login/actions";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f7f4] px-5 text-zinc-950">
      <section className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md bg-emerald-50 text-emerald-800">
            <LockKeyhole aria-hidden size={20} />
          </div>
          <h1 className="text-2xl font-semibold tracking-normal">Вход в панель</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Введите пароль администратора из переменной окружения ADMIN_PASSWORD.
          </p>
        </div>

        <form action={loginAction} className="grid gap-4">
          <label className="grid gap-1.5 text-sm font-medium text-zinc-800">
            Пароль
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-200"
            />
          </label>

          {error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">Неверный пароль.</p>
          ) : null}

          <button className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800">
            Войти
          </button>
        </form>
      </section>
    </main>
  );
}
