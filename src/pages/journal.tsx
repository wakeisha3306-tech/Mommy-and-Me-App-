import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PenLine, Trash2, Heart, Flower, Share2 } from "lucide-react";
import { ShareMomentDialog } from "@/components/share-moment-dialog";
import { Layout } from "@/components/layout";
import { ContentState } from "@/components/content-state";
import { useJournal } from "@/hooks/use-journal";
import { toast } from "@/hooks/use-toast";
import { SHARE_CARD_TAGLINE } from "@/lib/brand";
import type { ShareCardContent } from "@/lib/share-card";
import { formatFriendlyTimestamp } from "@/lib/utils";

type Author = "Mom" | "Daughter";

const AUTHOR_CONFIG: Record<Author, { emoji: string; badge: string }> = {
  Mom: {
    emoji: "👩🏾",
    badge: "bg-primary/15 text-primary",
  },
  Daughter: {
    emoji: "👧🏾",
    badge: "bg-accent/20 text-accent-foreground",
  },
};

const MOODS = [
  { label: "Grateful", emoji: "🙏🏽" },
  { label: "Happy", emoji: "😊" },
  { label: "Reflective", emoji: "💭" },
  { label: "Strong", emoji: "💪🏽" },
  { label: "Tired", emoji: "🌙" },
  { label: "Loved", emoji: "💛" },
];

export default function Journal() {
  const { entries, addEntry, deleteEntry, toggleFavorite, isLoaded } = useJournal();
  const promptFromQuery = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("prompt")?.trim() ?? "";
  }, []);
  const [newEntry, setNewEntry] = useState("");
  const [author, setAuthor] = useState<Author>("Mom");
  const [mood, setMood] = useState<string | null>(null);
  const [shareItem, setShareItem] = useState<ShareCardContent | null>(null);

  useEffect(() => {
    if (!promptFromQuery) return;
    setNewEntry((current) => {
      if (current.trim()) return current;
      return `${promptFromQuery}\n\n`;
    });
  }, [promptFromQuery]);

  const handleSave = () => {
    if (!newEntry.trim()) return;

    const text = mood ? `${mood} · ${newEntry.trim()}` : newEntry.trim();
    void addEntry(text, author).then((success) => {
      if (!success) {
        toast({
          title: "Couldn't save entry",
          description: "Please try again in a moment.",
        });
        return;
      }

      setNewEntry("");
      setMood(null);
      toast({
        title: "Entry saved",
        description: "Your journal entry is now tied to your account.",
      });
    });
  };

  return (
    <Layout title="Journal" subtitle="Your private space to feel, reflect, and grow">
      <div className="mt-3 section-stack">
        <ShareMomentDialog item={shareItem} onClose={() => setShareItem(null)} />
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="app-card overflow-hidden">
          <div className="flex border-b border-border">
            {(["Mom", "Daughter"] as Author[]).map((nextAuthor) => (
              <button
                key={nextAuthor}
                onClick={() => setAuthor(nextAuthor)}
                className={`flex flex-1 items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-all duration-200 ${
                  author === nextAuthor ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <span>{AUTHOR_CONFIG[nextAuthor].emoji}</span>
                {nextAuthor}
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

            <div className="mb-4 flex flex-wrap gap-2">
              {MOODS.map((nextMood) => {
                const selectedMood = `${nextMood.emoji} ${nextMood.label}`;
                return (
                  <button
                    key={nextMood.label}
                    onClick={() => setMood(mood === selectedMood ? null : selectedMood)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                      mood === selectedMood
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-transparent bg-muted/60 text-muted-foreground hover:border-border"
                    }`}
                  >
                    {nextMood.emoji} {nextMood.label}
                  </button>
                );
              })}
            </div>

            <textarea
              value={newEntry}
              onChange={(event) => setNewEntry(event.target.value)}
              placeholder="What's on your heart today?"
              className="min-h-[120px] w-full resize-none rounded-2xl border-none bg-muted/30 p-4 text-base text-foreground placeholder:text-muted-foreground transition-shadow focus:outline-none focus:ring-2 focus:ring-primary/20"
            />

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <PenLine className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {entries.length} {entries.length === 1 ? "entry" : "entries"}
                </span>
              </div>
              <button
                onClick={handleSave}
                disabled={!newEntry.trim()}
                className="app-button-primary flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Heart className="h-4 w-4" />
                Save
              </button>
            </div>
          </div>
        </motion.div>

        <div>
          <p className="mb-3 px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Past Entries</p>

          {!isLoaded ? (
            <ContentState message="Loading journal entries..." loading />
          ) : entries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center gap-3 py-14 text-center"
            >
              <Flower className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-lg font-serif italic text-muted-foreground">
                Nothing written yet, but your heart has room here whenever you're ready.
              </p>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-3">
              <AnimatePresence>
                {entries.map((entry) => {
                  const entryAuthor = (entry.author as Author) || "Mom";
                  const config = AUTHOR_CONFIG[entryAuthor] || AUTHOR_CONFIG.Mom;

                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.25 }}
                      className="group app-card-soft p-5"
                    >
                      <div className="mb-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${config.badge}`}>
                            {config.emoji} {entryAuthor}
                          </span>
                          <span className="text-xs text-muted-foreground">{formatFriendlyTimestamp(entry.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              setShareItem({
                                label: "Journal",
                                text: entry.text,
                                tagline: SHARE_CARD_TAGLINE,
                              })
                            }
                            className="rounded-xl px-2.5 py-2 text-xs font-semibold text-muted-foreground transition-all duration-200 hover:bg-primary/8 hover:text-primary"
                          >
                            <span className="inline-flex items-center gap-1.5">
                              <Share2 className="h-3.5 w-3.5" />
                              Share 💛
                            </span>
                          </button>
                          <button
                            onClick={() => {
                              void toggleFavorite(entry.id, !entry.is_favorite);
                            }}
                            className={`rounded-xl p-2 transition-all duration-200 ${
                              entry.is_favorite ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-primary/8 hover:text-primary"
                            }`}
                          >
                            <Heart className={`h-4 w-4 ${entry.is_favorite ? "fill-current" : ""}`} />
                          </button>
                          <button
                            onClick={() => {
                              void deleteEntry(entry.id);
                            }}
                            className="rounded-xl p-1.5 text-muted-foreground opacity-0 transition-all duration-200 hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{entry.text}</p>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
