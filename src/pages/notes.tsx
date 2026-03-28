import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flower, Heart, Link2, Lock, MessageCircleHeart, Send, Share2, Trash2, Users } from "lucide-react";
import { Layout } from "@/components/layout";
import { ContentState } from "@/components/content-state";
import { ShareMomentDialog } from "@/components/share-moment-dialog";
import { useAuth } from "@/context/auth-context";
import { useConnection } from "@/hooks/use-connection";
import { useDirectMessages } from "@/hooks/use-direct-messages";
import { useNotes, type Note, type NoteSpace } from "@/hooks/use-notes";
import { toast } from "@/hooks/use-toast";
import { SHARE_CARD_TAGLINE } from "@/lib/brand";
import type { ShareCardContent } from "@/lib/share-card";
import { formatFriendlyTimestamp } from "@/lib/utils";

type NotesTab = "private" | "shared" | "direct";

const TAB_CONFIG: Record<NotesTab, { label: string; description: string; icon: typeof Lock }> = {
  private: {
    label: "My Space",
    description: "Private notes only you can see",
    icon: Lock,
  },
  shared: {
    label: "Between Us",
    description: "Shared notes for the two of you",
    icon: Users,
  },
  direct: {
    label: "Direct Messages",
    description: "Intentional messages between you both",
    icon: MessageCircleHeart,
  },
};

const PRIVATE_PROMPTS = [
  "A thought I want to keep to myself for now...",
  "Something I want to remember from today...",
  "A quiet feeling I want to hold onto...",
];

const SHARED_PROMPTS = [
  "Something I want us to carry together...",
  "A note I want to leave between us...",
  "A little truth I want to share with you...",
];

const DIRECT_PROMPTS = [
  "A soft message just for you...",
  "Something I want to tell you directly...",
  "A little note from my heart to yours...",
];

const OWN_BADGE = {
  Mom: "bg-primary/15 text-primary",
  Daughter: "bg-accent/20 text-accent-foreground",
} as const;

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center gap-3 py-14 text-center"
    >
      <Flower className="h-8 w-8 text-muted-foreground/40" />
      <p className="text-lg font-serif italic text-muted-foreground">{title}</p>
      <p className="max-w-sm text-sm leading-6 text-muted-foreground">{body}</p>
    </motion.div>
  );
}

function NotesList({
  notes,
  currentUserId,
  onShare,
  onToggleFavorite,
  onDelete,
  onMove,
}: {
  notes: Note[];
  currentUserId?: string;
  onShare: (item: ShareCardContent) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, space: NoteSpace) => void;
}) {
  if (notes.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence>
        {notes.map((note) => {
          const isOwn = note.user_id === currentUserId;
          const spaceLabel = note.is_shared ? (isOwn ? "Shared by you" : "Shared with you") : "Private to you";

          return (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.22 }}
              className="app-card-soft p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${OWN_BADGE[note.author]}`}>
                      {note.author}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatFriendlyTimestamp(note.created_at)}</span>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/70">{spaceLabel}</span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground">{note.text}</p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      onShare({
                        label: note.is_shared ? "Between Us" : "My Space",
                        text: note.text,
                        tagline: SHARE_CARD_TAGLINE,
                      })
                    }
                    className="rounded-xl px-2.5 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-primary/8 hover:text-primary"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <Share2 className="h-3.5 w-3.5" />
                      Share 💛
                    </span>
                  </button>

                  {isOwn ? (
                    <button
                      onClick={() => onToggleFavorite(note.id, !note.is_favorite)}
                      className={`rounded-xl p-2 transition-colors ${
                        note.is_favorite ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-primary/8 hover:text-primary"
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${note.is_favorite ? "fill-current" : ""}`} />
                    </button>
                  ) : null}

                  {isOwn ? (
                    <button
                      onClick={() => onMove(note.id, note.is_shared ? "private" : "shared")}
                      className="rounded-xl px-2.5 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-primary/8 hover:text-primary"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Link2 className="h-3.5 w-3.5" />
                        {note.is_shared ? "Keep private" : "Share with partner"}
                      </span>
                    </button>
                  ) : null}

                  {isOwn ? (
                    <button
                      onClick={() => onDelete(note.id)}
                      className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export default function Notes() {
  const { session, profile } = useAuth();
  const { connection, partnerRole } = useConnection();
  const {
    privateNotes,
    sharedNotes,
    receivedSharedNotes,
    isLoaded: notesLoaded,
    error: notesError,
    addNote,
    deleteNote,
    toggleFavorite,
    moveNoteToSpace,
  } = useNotes();
  const {
    messages,
    isLoaded: messagesLoaded,
    error: messagesError,
    sendMessage,
  } = useDirectMessages();

  const promptFromQuery = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("prompt")?.trim() ?? "";
  }, []);
  const tabFromQuery = useMemo(() => {
    if (typeof window === "undefined") return "private";
    const nextTab = new URLSearchParams(window.location.search).get("tab");
    return nextTab === "shared" || nextTab === "direct" ? nextTab : "private";
  }, []);

  const [activeTab, setActiveTab] = useState<NotesTab>(tabFromQuery);
  const [draft, setDraft] = useState("");
  const [shareItem, setShareItem] = useState<ShareCardContent | null>(null);

  useEffect(() => {
    if (!promptFromQuery) return;
    setDraft((current) => (current.trim() ? current : `${promptFromQuery}\n\n`));
  }, [promptFromQuery]);

  const connected = Boolean(connection?.partner_id);
  const sharedFeed = sharedNotes;
  const directFeed = useMemo(
    () => [...messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [messages],
  );
  const currentTab = TAB_CONFIG[activeTab];
  const currentPlaceholder =
    activeTab === "private"
      ? PRIVATE_PROMPTS[0]
      : activeTab === "shared"
        ? SHARED_PROMPTS[0]
        : DIRECT_PROMPTS[0];

  const handleCreate = async () => {
    if (!draft.trim()) return;

    if (activeTab === "direct") {
      const success = await sendMessage(draft.trim());
      if (!success) {
        toast({
          title: "Couldn't send message",
          description: "Please try again in a moment.",
        });
        return;
      }

      setDraft("");
      toast({
        title: "Message sent",
        description: "Your message was sent privately.",
      });
      return;
    }

    const success = await addNote(draft.trim(), activeTab);
    if (!success) {
      toast({
        title: "Couldn't save note",
        description: "Please try again in a moment.",
      });
      return;
    }

    setDraft("");
    toast({
      title: activeTab === "private" ? "Saved to My Space" : "Saved to Between Us",
      description:
        activeTab === "private"
          ? "Only you can see this note."
          : "This note is now visible to your connected partner too.",
    });
  };

  const notesErrorMessage = notesError ?? messagesError;
  const directEmptyText = connected
    ? "No direct messages yet."
    : "Connect your accounts first to send private messages.";

  return (
    <Layout title="Notes" subtitle="Private thoughts, shared notes, and messages that stay intentional">
      <div className="mt-3 section-stack">
        <ShareMomentDialog item={shareItem} onClose={() => setShareItem(null)} />

        {notesErrorMessage ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {notesErrorMessage}
          </div>
        ) : null}

        <section className="app-card overflow-hidden">
          <div className="border-b border-border/80 px-4 py-4">
            <div className="grid grid-cols-3 gap-2 rounded-[1.3rem] bg-muted/45 p-1">
              {(Object.keys(TAB_CONFIG) as NotesTab[]).map((tab) => {
                const tabMeta = TAB_CONFIG[tab];
                const Icon = tabMeta.icon;
                const active = tab === activeTab;

                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-[1.1rem] px-3 py-3 text-left transition-all duration-200 ${
                      active ? "bg-white shadow-sm" : "text-muted-foreground hover:bg-white/65"
                    }`}
                  >
                    <div className={`inline-flex items-center gap-2 text-sm font-semibold ${active ? "text-foreground" : ""}`}>
                      <Icon className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
                      {tabMeta.label}
                    </div>
                    <p className="mt-1 text-[11px] leading-5 text-muted-foreground">{tabMeta.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-5">
            <div className="rounded-[1.2rem] border border-primary/10 bg-primary/6 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/75">
                {activeTab === "private" ? "My Space" : activeTab === "shared" ? "Between Us" : "Direct Messages"}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {activeTab === "private" &&
                  "These notes stay private to you. Nothing here is visible to your connected partner unless you choose to move it into Between Us."}
                {activeTab === "shared" &&
                  "Anything written here is intentionally shared with your connected partner. It shows up for both of you and stays out of My Space."}
                {activeTab === "direct" &&
                  "Messages here are private between sender and recipient only. They are not public and they do not appear in shared notes."}
              </p>
              <p className="mt-2 text-xs font-medium text-foreground">Writing as {profile?.role ?? "your profile"}</p>
            </div>

            {promptFromQuery && activeTab !== "direct" ? (
              <div className="mt-4 rounded-[1.2rem] border border-primary/15 bg-primary/8 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80">Connection prompt</p>
                <p className="mt-2 text-sm leading-6 text-foreground">{promptFromQuery}</p>
              </div>
            ) : null}

            <div className="mt-4">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={currentPlaceholder}
                disabled={activeTab === "direct" && !connected}
                className="min-h-[110px] w-full resize-none rounded-2xl bg-muted/30 p-4 text-base text-foreground placeholder:text-muted-foreground transition-shadow focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  {activeTab === "private" && "Visible only to you"}
                  {activeTab === "shared" && (connected ? `Visible to you and ${partnerRole}` : "Connect first to share notes")}
                  {activeTab === "direct" && (connected ? `Sent privately to ${partnerRole}` : "Connect first to send direct messages")}
                </p>
                <button
                  type="button"
                  onClick={() => void handleCreate()}
                  disabled={!draft.trim() || ((activeTab === "shared" || activeTab === "direct") && !connected)}
                  className="app-button-primary flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                  {activeTab === "direct" ? "Send message" : activeTab === "shared" ? "Share note" : "Save note"}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section>
          {activeTab === "private" && (
            <>
              {!notesLoaded ? (
                <ContentState message="Loading My Space..." loading />
              ) : privateNotes.length === 0 ? (
                <EmptyState
                  title="No private notes yet."
                  body="This space is only for you. Save a thought here when you want to keep it close before sharing anything."
                />
              ) : (
                <NotesList
                  notes={privateNotes}
                  currentUserId={session?.user.id}
                  onShare={setShareItem}
                  onToggleFavorite={(id, isFavorite) => {
                    void toggleFavorite(id, isFavorite);
                  }}
                  onDelete={(id) => {
                    void deleteNote(id);
                  }}
                  onMove={(id, space) => {
                    void moveNoteToSpace(id, space);
                  }}
                />
              )}
            </>
          )}

          {activeTab === "shared" && (
            <>
              {!notesLoaded ? (
                <ContentState message="Loading Between Us..." loading />
              ) : sharedFeed.length === 0 ? (
                <EmptyState
                  title="Nothing in Between Us yet."
                  body={
                    connected
                      ? "When one of you intentionally shares a note, it will appear here for both of you."
                      : "Connect your accounts first, then shared notes will live here for both of you."
                  }
                />
              ) : (
                <NotesList
                  notes={sharedFeed}
                  currentUserId={session?.user.id}
                  onShare={setShareItem}
                  onToggleFavorite={(id, isFavorite) => {
                    void toggleFavorite(id, isFavorite);
                  }}
                  onDelete={(id) => {
                    void deleteNote(id);
                  }}
                  onMove={(id, space) => {
                    void moveNoteToSpace(id, space);
                  }}
                />
              )}
            </>
          )}

          {activeTab === "direct" && (
            <>
              {!messagesLoaded ? (
                <ContentState message="Loading direct messages..." loading />
              ) : directFeed.length === 0 ? (
                <EmptyState
                  title={directEmptyText}
                  body={
                    connected
                      ? "Send one gentle message and it will appear here for just the two of you."
                      : "Once you're connected, direct messages will stay private between sender and recipient only."
                  }
                />
              ) : (
                <div className="flex flex-col gap-3">
                  {directFeed.map((message) => {
                    const isOwn = message.sender_id === session?.user.id;
                    return (
                      <div key={message.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[82%] rounded-2xl border px-4 py-3 shadow-sm ${
                            isOwn
                              ? "rounded-tr-sm border-primary/15 bg-primary/10"
                              : "rounded-tl-sm border-border bg-white"
                          }`}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${OWN_BADGE[message.sender_role]}`}>
                              {message.sender_role}
                            </span>
                            <span className="text-xs text-muted-foreground">{formatFriendlyTimestamp(message.created_at)}</span>
                          </div>
                          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground">{message.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>

        {activeTab === "shared" && connected && receivedSharedNotes.length > 0 ? (
          <p className="text-center text-xs text-muted-foreground">
            Shared notes from {partnerRole} appear here only because they were intentionally moved into Between Us.
          </p>
        ) : null}
      </div>
    </Layout>
  );
}
