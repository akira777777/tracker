"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyLink({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-300 text-zinc-600 transition hover:border-zinc-500 hover:text-zinc-950"
      title={copied ? "Скопировано" : "Скопировать ссылку"}
      aria-label={copied ? "Скопировано" : "Скопировать ссылку"}
    >
      {copied ? <Check aria-hidden size={15} /> : <Copy aria-hidden size={15} />}
    </button>
  );
}
