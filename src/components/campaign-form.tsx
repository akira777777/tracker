"use client";

import { Plus } from "lucide-react";
import { useActionState } from "react";
import { createCampaignAction, type CampaignFormState } from "@/app/admin/actions";

const initialCampaignFormState: CampaignFormState = {
  status: "idle",
  message: "",
};

export function CampaignForm() {
  const [state, formAction, pending] = useActionState(
    createCampaignAction,
    initialCampaignFormState,
  );

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium text-zinc-800">
          Название
          <input
            name="name"
            required
            maxLength={120}
            className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-200"
            placeholder="Весенняя кампания"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-zinc-800">
          Slug
          <input
            name="slug"
            minLength={3}
            maxLength={80}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-200"
            placeholder="spring-campaign"
          />
        </label>
      </div>

      <label className="grid gap-1.5 text-sm font-medium text-zinc-800">
        Целевой URL
        <input
          name="targetUrl"
          required
          type="url"
          className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-200"
          placeholder="https://example.com"
        />
      </label>

      <label className="grid gap-1.5 text-sm font-medium text-zinc-800">
        Описание
        <textarea
          name="description"
          maxLength={240}
          rows={3}
          className="resize-none rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-200"
          placeholder="Внутренняя заметка для панели"
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus aria-hidden size={16} />
          {pending ? "Создание..." : "Создать кампанию"}
        </button>
        {state.message ? (
          <p
            className={
              state.status === "error"
                ? "text-sm text-red-700"
                : "text-sm text-emerald-700"
            }
          >
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
