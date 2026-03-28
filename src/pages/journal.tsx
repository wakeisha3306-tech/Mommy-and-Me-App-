import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PenLine, Trash2, Heart, Flower } from "lucide-react";
import { Layout } from "@/components/layout";
import { ContentState } from "@/components/content-state";
import { useJournal } from "@/hooks/use-journal";
import { toast } from "@/hooks/use-toast";
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
  { label: "Loved", emoji: "💕" },
];

export default function Journal() {
  const { entries, addEntry, deleteEntry, isLoaded } = useJournal();
  const [newEntry, setNewEntry] = useState("");
  const [author, setAuthor] = useState<Author>("Mom");
  const [mood, setMood] = useState<string | null>(null);

  const handleSave = () => {
    if (!newEntry.trim()) return;

    const text = mood ? `${mood} · ${newEntry.trim()}` : newEntry.trim();
    void addEntry(text, author).then((success) => {
      if (!success) {
        toast({
          title: "Couldn't save entry",
          description: "Please check your Supabase setup and try again.",
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
      <div className="section-stack mt-3">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="app-card overflow-hidden"
        >
          <div className="flex border-b border-border">
            {(["Mom", "Daughter"] as Author[]).map((nextAuthor) => (
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
                {nextAuthor}
              </button>
            ))}
          </div>

          <div className="p-5">
            <div className="flex flex-wrap gap-2 mb-4">
              {MOODS.map((nextMood) => {
                const selectedMood = `${nextMood.emoji} ${nextMood.label}`;
                return (
                  <button
                    key={nextMood.label}
                    onClick={() => setMood(mood === selectedMood ? null : selectedMood)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                      mood === selectedMood
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/60 text-muted-foreground border-transparent hover:border-border"
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
              className="w-full min-h-[120px] bg-muted/30 rounded-2xl p-4 resize-none border-none focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground text-base transition-shadow"
            />

            <div className="flex justify-between items-center mt-4">
              <div className="flex items-center gap-1.5">
                <PenLine className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {entries.length} {entries.length === 1 ? "entry" : "entries"}
                </span>
              </div>
              <button
                onClick={handleSave}
                disabled={!newEntry.trim()}
                className="app-button-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Heart className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>
        </motion.div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 px-1">Past Entries</p>

          {!isLoaded ? (
            <ContentState message="Loading journal entries..." loading />
          ) : entries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-14 text-center gap-3"
            >
              <Flower className="w-8 h-8 text-muted-foreground/40" />
              <p className="text-muted-foreground font-serif italic text-lg">
                No journal entries yet. Start writing your first one.
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
                      className="app-card-soft p-5 group"
                    >
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${config.badge}`}>
                            {config.emoji} {entryAuthor}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatFriendlyTimestamp(entry.created_at)}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            void deleteEntry(entry.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive rounded-xl hover:bg-destructive/10 transition-all duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-foreground leading-relaxed text-sm whitespace-pre-wrap">{entry.text}</p>
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
