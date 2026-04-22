"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { sendChatMessage, deleteChatMessage } from "@/app/actions/chat";
import { ConfigBanner } from "@/components/dashboard/config-banner";
import { FormLabel } from "@/components/dashboard/status-pill";

type Msg = { id: string; body: string; author_name: string; created_at: string };

export function ChatThreadPanel({ initialMessages, hasSupabase, queryError }: { initialMessages: Msg[]; hasSupabase: boolean; queryError: string | null }) {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [body, setBody] = useState("");
  const [author, setAuthor] = useState("ICQA Team");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const scrollToEnd = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!hasSupabase) return;
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    const channel = supabase
      .channel("icqa_chat")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_messages" },
        (payload) => {
          if (payload.eventType === "INSERT" && payload.new) {
            const n = payload.new as Msg;
            setMessages((prev) => (prev.some((m) => m.id === n.id) ? prev : [...prev, n]));
            setTimeout(() => scrollToEnd(), 50);
          } else if (payload.eventType === "DELETE" && payload.old) {
            const o = payload.old as { id?: string };
            if (o.id) {
              setMessages((prev) => prev.filter((m) => m.id !== o.id));
            }
          }
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [hasSupabase, scrollToEnd]);

  const onSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasSupabase) {
      setError("Configure Supabase to send messages.");
      return;
    }
    const t = body.trim();
    if (!t) return;
    setError(null);
    startTransition(async () => {
      const res = await sendChatMessage(t, author);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setBody("");
      router.refresh();
    });
  };

  const onDelete = (id: string) => {
    if (!hasSupabase) {
      setError("Configure Supabase to delete messages.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await deleteChatMessage(id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setMessages((prev) => prev.filter((m) => m.id !== id));
      router.refresh();
    });
  };

  return (
    <div>
      {!hasSupabase ? <ConfigBanner /> : null}
      {queryError && queryError !== "missing_config" ? (
        <p className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">
          {queryError}
        </p>
      ) : null}
      {error ? (
        <p className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">
          {error}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-200/80 px-5 py-4">
          <h3 className="text-base font-bold text-slate-900">Manager &amp; associate chat</h3>
          <p className="text-sm text-slate-500">Messages sync in real time when Realtime is enabled in Supabase.</p>
        </div>
        <div className="max-h-[50vh] space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
          {messages.length === 0 ? (
            <p className="text-sm text-slate-500">No messages yet. Say hello to start the thread.</p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="group flex items-start justify-between gap-2 rounded-lg border border-slate-200/60 bg-slate-50/80 px-3 py-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">{m.author_name}</span>
                    <time dateTime={m.created_at}>{new Date(m.created_at).toLocaleString()}</time>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{m.body}</p>
                </div>
                <button
                  type="button"
                  className="shrink-0 text-xs text-slate-400 opacity-0 transition hover:text-rose-600 group-hover:opacity-100"
                  onClick={() => onDelete(m.id)}
                  disabled={pending}
                >
                  Delete
                </button>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={onSend} className="space-y-3 border-t border-slate-200/80 px-4 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <FormLabel>Your name</FormLabel>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              />
            </div>
          </div>
          <div>
            <FormLabel>Message</FormLabel>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share updates, questions, or handoff notes…"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-60"
              disabled={pending}
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
