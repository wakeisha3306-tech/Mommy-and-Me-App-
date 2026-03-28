import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Trash2, MessageCircleHeart, Flower, Heart } from "lucide-react";
import { Layout } from "@/components/layout";
import { ContentState } from "@/components/content-state";
import { useNotes, type NoteAuthor } from "@/hooks/use-notes";
import { toast } from "@/hooks/use-toast";
import { formatFriendlyTimestamp } from "@/lib/utils";

const AUTHOR_CONFIG: Record<
  NoteAuthor,
  { emoji: string; bgCard: string; badge: string; nameBg: string }
> = {
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
  "I love you so much 💕",
  "You make me so proud 🌟",
  "Thank you for being you 🌸",
  "I'm always here for you 🤗",
  "You are doing amazing 💪🏽",
  "I was thinking of you 💭",
];

export default function Notes() {
  const { notes, isLoaded, error, addNote, deleteNote, toggleFavorite } = useNotes();
  const promptFromQuery = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("prompt")?.trim() ?? "";
  }, []);
  const [text, setText] = useState("");
  const [author, setAuthor] = useState<NoteAuthor>("Mom");

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
          description: "Please check your Supabase setup and try again.",
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
      <div className="section-stack mt-3">
        {error && (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="app-card overflow-hidden"
        >
          <div className="flex border-b border-border">
            {(["Mom", "Daughter"] as NoteAuthor[]).map((nextAuthor) => (
              <button
                key={nextAuthor}
                onClick={() => setAuthor(nextAuthor)}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-all duration-200 ${
                  author === nextAuthor
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <span>{AUTHOR_CONFIG[nextAuthor].emoji}</span>
                {nextAuthor}'s Note
              </button>
            ))}
          </div>

          <div className="p-5">
            {promptFromQuery && (
              <div className="mb-4 rounded-[1.2rem] border border-primary/15 bg-primary/8 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80">Connection prompt</p>
                <p className="mt-2 text-sm leading-6 text-foreground">{promptFromQuery}</p>
              </div>
            )}

            <p className="text-xs text-muted-foreground mb-3">Quick picks:</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {QUICK_NOTES.map((quickNote) => (
                <button
                  key={quickNote}
                  onClick={() => setText(quickNote)}
                  className="text-xs px-3 py-1.5 rounded-full bg-muted/60 text-muted-foreground border border-transparent hover:border-border hover:bg-muted transition-all duration-200"
                >
                  {quickNote}
                </button>
              ))}
            </div>

            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={
                author === "Mom"
                  ? "Leave a little love note for your daughter..."
                  : "Leave a little love note for Mom..."
              }
              className="w-full min-h-[100px] bg-muted/30 rounded-2xl p-4 resize-none border-none focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground text-base transition-shadow"
            />

            <div className="flex justify-end mt-4">
              <button
                onClick={handleSend}
                disabled={!text.trim()}
                className="app-button-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                Send Note
              </button>
            </div>
          </div>
        </motion.div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 px-1">
            Our Conversation
          </p>

          {!isLoaded ? (
            <ContentState message="Loading notes..." loading />
          ) : notes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-14 text-center gap-3"
            >
              <MessageCircleHeart className="w-8 h-8 text-muted-foreground/40" />
              <p className="text-muted-foreground font-serif italic text-lg">No notes yet. Send your first message.</p>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-3">
              <AnimatePresence>
                {notes.map((note) => {
                  const config = AUTHOR_CONFIG[note.author];
                  const isMom = note.author === "Mom";

                  return (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, x: isMom ? -16 : 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.25 }}
                      className={`flex ${isMom ? "justify-start" : "justify-end"}`}
                    >
                      <div className="max-w-[82%] group">
                        <div
                          className={`relative rounded-2xl border p-4 shadow-md ${config.bgCard} ${
                            isMom ? "rounded-tl-sm" : "rounded-tr-sm"
                          }`}
                        >
                          <p className="text-foreground text-sm leading-relaxed">{note.text}</p>
                          <div className="absolute -top-2 -right-2 flex items-center gap-1">
                            <button
                              onClick={() => {
                                void toggleFavorite(note.id, !note.is_favorite);
                              }}
                              className={`flex h-7 w-7 items-center justify-center rounded-full border border-border bg-white shadow-sm transition-all duration-200 ${
                                note.is_favorite ? "text-primary" : "text-muted-foreground hover:text-primary"
                              }`}
                            >
                              <Heart className={`w-3.5 h-3.5 ${note.is_favorite ? "fill-current" : ""}`} />
                            </button>
                            <button
                              onClick={() => {
                                void deleteNote(note.id);
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-white border border-border shadow-sm opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all duration-200"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <div className={`flex items-center gap-1.5 mt-1.5 ${isMom ? "justify-start" : "justify-end"}`}>
                          <span className="text-xs text-muted-foreground/70">
                            {config.emoji} {note.author} · {formatFriendlyTimestamp(note.created_at)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              <div className="flex items-center justify-center py-2 gap-2">
                <Flower className="w-3.5 h-3.5 text-muted-foreground/40" />
                <span className="text-xs text-muted-foreground/50 italic">
                  {notes.length} note{notes.length !== 1 ? "s" : ""} shared
                </span>
                <Flower className="w-3.5 h-3.5 text-muted-foreground/40" />
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
