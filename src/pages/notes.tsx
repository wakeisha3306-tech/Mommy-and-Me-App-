import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Trash2, MessageCircleHeart, Flower, Heart, Share2, Link2 } from "lucide-react";
import { ShareMomentDialog } from "@/components/share-moment-dialog";
import { Layout } from "@/components/layout";
import { ContentState } from "@/components/content-state";
import { useAuth } from "@/context/auth-context";
import { useNotes, type NoteAuthor } from "@/hooks/use-notes";
import { toast } from "@/hooks/use-toast";
import { SHARE_CARD_TAGLINE } from "@/lib/brand";
import type { ShareCardContent } from "@/lib/share-card";
import { formatFriendlyTimestamp } from "@/lib/utils";

const AUTHOR_CONFIG: Record<NoteAuthor, { emoji: string; bgCard: string; badge: string; nameBg: string }> = {
  Mom: {
    emoji: "👩🏾",
    bgCard: "bg-primary/8 border-primary/15",
    badge: "bg-primary/15 text-primary",
    nameBg: "from-primary/20 to-primary/5",
  },
  Daughter: {
    emoji: "👧🏾",
    bgCard: "bg-accent/10 border-accent/15",
    badge: "bg-accent/20 text-accent-foreground",
    nameBg: "from-accent/20 to-accent/5",
  },
};

const QUICK_NOTES = [
  "I love you so much 💛",
  "You make me so proud 🌟",
  "Thank you for being you 🌸",
  "I'm always here for you 🤗",
  "You are doing amazing 💪🏽",
  "I was thinking of you 💭",
];

export default function Notes() {
  const { session } = useAuth();
  const { notes, isLoaded, error, addNote, deleteNote, toggleFavorite, toggleShared } = useNotes();
  const promptFromQuery = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("prompt")?.trim() ?? "";
  }, []);
  const [text, setText] = useState("");
  const [author, setAuthor] = useState<NoteAuthor>("Mom");
  const [shareItem, setShareItem] = useState<ShareCardContent | null>(null);

  useEffect(() => {
    if (!promptFromQuery) return;
    setText((current) => {
      if (current.trim()) return current;
      return `${promptFromQuery}\n\n`;
    });
  }, [promptFromQuery]);

  const handleSend = () => {
    if (!text.trim()) return;

    void addNote(text.trim(), author).then((success) => {
      if (!success) {
        toast({
          title: "Couldn't save note",
          description: "Please try again in a moment.",
        });
        return;
      }

      setText("");
      toast({
        title: "Note saved",
        description: "Your note is now stored in your account.",
      });
    });
  };

  return (
    <Layout title="Our Notes" subtitle="Little messages between us, always">
      <div className="mt-3 section-stack">
        <ShareMomentDialog item={shareItem} onClose={() => setShareItem(null)} />
        {error ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="app-card overflow-hidden">
          <div className="flex border-b border-border">
            {(["Mom", "Daughter"] as NoteAuthor[]).map((nextAuthor) => (
              <button
                key={nextAuthor}
                onClick={() => setAuthor(nextAuthor)}
                className={`flex flex-1 items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-all duration-200 ${
                  author === nextAuthor ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <span>{AUTHOR_CONFIG[nextAuthor].emoji}</span>
                {nextAuthor}'s Note
              </button>
            ))}
          </div>

          <div className="p-5">
            {promptFromQuery ? (
              <div className="mb-4 rounded-[1.2rem] border border-primary/15 bg-primary/8 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80">Connection prompt</p>
                <p className="mt-2 text-sm leading-6 text-foreground">{promptFromQuery}</p>
              </div>
            ) : null}

            <p className="mb-3 text-xs text-muted-foreground">Quick picks:</p>
            <div className="mb-4 flex flex-wrap gap-2">
              {QUICK_NOTES.map((quickNote) => (
                <button
                  key={quickNote}
                  onClick={() => setText(quickNote)}
                  className="rounded-full border border-transparent bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground transition-all duration-200 hover:border-border hover:bg-muted"
                >
                  {quickNote}
                </button>
              ))}
            </div>

            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={author === "Mom" ? "Leave a little love note for your daughter..." : "Leave a little love note for Mom..."}
              className="min-h-[100px] w-full resize-none rounded-2xl bg-muted/30 p-4 text-base text-foreground placeholder:text-muted-foreground transition-shadow focus:outline-none focus:ring-2 focus:ring-primary/20"
            />

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSend}
                disabled={!text.trim()}
                className="app-button-primary flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
                Send Note
              </button>
            </div>
          </div>
        </motion.div>

        <div>
          <p className="mb-3 px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Our Conversation</p>

          {!isLoaded ? (
            <ContentState message="Loading notes..." loading />
          ) : notes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center gap-3 py-14 text-center"
            >
              <MessageCircleHeart className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-lg font-serif italic text-muted-foreground">No notes yet. Send your first message.</p>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-3">
              <AnimatePresence>
                {notes.map((note) => {
                  const config = AUTHOR_CONFIG[note.author];
                  const isMom = note.author === "Mom";
                  const isOwnNote = note.user_id === session?.user.id;
                  const noteSourceLabel = isOwnNote
                    ? note.is_shared
                      ? "Shared with your connection"
                      : "Private to you"
                    : "Shared with you";

                  return (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, x: isMom ? -16 : 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.25 }}
                      className={`flex ${isMom ? "justify-start" : "justify-end"}`}
                    >
                      <div className="group max-w-[82%]">
                        <div
                          className={`relative rounded-2xl border p-4 shadow-md ${config.bgCard} ${
                            isMom ? "rounded-tl-sm" : "rounded-tr-sm"
                          }`}
                        >
                          <p className="text-sm leading-relaxed text-foreground">{note.text}</p>
                          <div className="absolute -right-2 -top-2 flex items-center gap-1">
                            <button
                              onClick={() =>
                                setShareItem({
                                  label: "Note",
                                  text: note.text,
                                  tagline: SHARE_CARD_TAGLINE,
                                })
                              }
                              className="rounded-full border border-border bg-white px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground shadow-sm transition-all duration-200 hover:text-primary"
                            >
                              <span className="inline-flex items-center gap-1">
                                <Share2 className="h-3 w-3" />
                                Share 💛
                              </span>
                            </button>
                            {isOwnNote ? (
                              <button
                                onClick={() => {
                                  void toggleShared(note.id, !note.is_shared);
                                }}
                                className={`rounded-full border border-border bg-white px-2.5 py-1.5 text-[11px] font-semibold shadow-sm transition-all duration-200 ${
                                  note.is_shared ? "text-primary" : "text-muted-foreground hover:text-primary"
                                }`}
                              >
                                <span className="inline-flex items-center gap-1">
                                  <Link2 className="h-3 w-3" />
                                  {note.is_shared ? "Shared" : "Private"}
                                </span>
                              </button>
                            ) : null}
                            <button
                              onClick={() => {
                                void toggleFavorite(note.id, !note.is_favorite);
                              }}
                              className={`flex h-7 w-7 items-center justify-center rounded-full border border-border bg-white shadow-sm transition-all duration-200 ${
                                note.is_favorite ? "text-primary" : "text-muted-foreground hover:text-primary"
                              }`}
                            >
                              <Heart className={`h-3.5 w-3.5 ${note.is_favorite ? "fill-current" : ""}`} />
                            </button>
                            {isOwnNote ? (
                              <button
                                onClick={() => {
                                  void deleteNote(note.id);
                                }}
                                className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-white text-muted-foreground opacity-0 shadow-sm transition-all duration-200 hover:text-destructive group-hover:opacity-100"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            ) : null}
                          </div>
                        </div>
                        <div className={`mt-1.5 flex items-center gap-1.5 ${isMom ? "justify-start" : "justify-end"}`}>
                          <span className="text-xs text-muted-foreground/70">
                            {config.emoji} {note.author} · {formatFriendlyTimestamp(note.created_at)}
                          </span>
                          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/70">
                            {noteSourceLabel}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              <div className="flex items-center justify-center gap-2 py-2">
                <Flower className="h-3.5 w-3.5 text-muted-foreground/40" />
                <span className="text-xs italic text-muted-foreground/50">
                  {notes.length} note{notes.length !== 1 ? "s" : ""} in this space
                </span>
                <Flower className="h-3.5 w-3.5 text-muted-foreground/40" />
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
