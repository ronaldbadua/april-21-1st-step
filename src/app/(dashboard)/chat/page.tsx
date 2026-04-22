import { PageHero } from "@/components/dashboard/page-hero";
import { ChatThreadPanel } from "@/components/dashboard/chat-thread-panel";
import { getChatMessages, isSupabaseConfigured } from "@/lib/data/queries";

export default async function ChatPage() {
  const { messages, error } = await getChatMessages();
  const hasConfig = isSupabaseConfigured();
  const threadKey = messages.length ? messages.map((m) => m.id).join("-") : "no-messages";

  return (
    <>
      <PageHero kicker="ICQA Team collaboration" title="ICQA Dashboard" pill="Chat Thread" />
      <ChatThreadPanel
        key={threadKey}
        initialMessages={messages}
        hasSupabase={hasConfig && error !== "missing_config"}
        queryError={error && error !== "missing_config" ? error : null}
      />
    </>
  );
}
