import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCcw, ChevronLeft, ChevronRight, Heart, Plus, Trash2 } from "lucide-react";
import { Layout } from "@/components/layout";
import { ContentState } from "@/components/content-state";
import { useAffirmations } from "@/hooks/use-affirmations";
import { toast } from "@/hooks/use-toast";
import { formatFriendlyTimestamp } from "@/lib/utils";

const AFFIRMATIONS = [
  { text: "I am strong and capable", emoji: "💪🏽" },
  { text: "I am loved and appreciated", emoji: "💕" },
  { text: "I can get through anything", emoji: "🌸" },
  { text: "My voice matters", emoji: "🗣️" },
  { text: "I am growing every day", emoji: "🌱" },
  { text: "I am enough, exactly as I am", emoji: "✨" },
  { text: "My love creates a safe place", emoji: "🏡" },
  { text: "I deserve peace and rest", emoji: "🌙" },
  { text: "I lead with grace and strength", emoji: "👑" },
  { text: "I am worthy of good things", emoji: "🌟" },
];

export default function Affirmations() {
  const { affirmations, isLoaded, addAffirmation, deleteAffirmation, toggleFavorite } = useAffirmations();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [customAffirmation, setCustomAffirmation] = useState("");

  const next = useCallback(() => {
    setDirection(1);
    setIndex((prev) => (prev + 1) % AFFIRMATIONS.length);
  }, []);

  const prev = useCallback(() => {
    setDirection(-1);
    setIndex((prev) => (prev - 1 + AFFIRMATIONS.length) % AFFIRMATIONS.length);
  }, []);

  const shuffle = useCallback(() => {
    setDirection(1);
    setIndex((prev) => {
      let nextIndex = Math.floor(Math.random() * AFFIRMATIONS.length);
      while (nextIndex === prev) {
        nextIndex = Math.floor(Math.random() * AFFIRMATIONS.length);
      }
      return nextIndex;
    });
  }, []);

  const current = AFFIRMATIONS[index];
  const alreadySaved = affirmations.some((affirmation) => affirmation.text === current.text);

  const handleSaveCurrent = async () => {
    if (alreadySaved) {
      toast({
        title: "Already saved",
        description: "This affirmation is already in your saved list.",
      });
      return;
    }

    const success = await addAffirmation(current.text, current.emoji, "preset");
    toast({
      title: success ? "Affirmation saved" : "Couldn't save affirmation",
      description: success ? "You can return to it anytime." : "Please check your Supabase setup and try again.",
    });
  };

  const handleSaveCustom = async () => {
    if (!customAffirmation.trim()) return;

    const success = await addAffirmation(customAffirmation.trim(), "✨", "custom");
    if (success) {
      setCustomAffirmation("");
    }

    toast({
      title: success ? "Custom affirmation saved" : "Couldn't save affirmation",
      description: success
        ? "Your own words are now part of your collection."
        : "Please check your Supabase setup and try again.",
    });
  };

  return (
    <Layout title="Affirmations" subtitle="Words to carry you through the day">
      <div className="flex-1 section-stack mt-4">
        <div className="relative h-72 flex items-center justify-center perspective-[1000px]">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={index}
              custom={direction}
              initial={{ opacity: 0, x: direction * 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: direction * -60, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="app-card absolute inset-0 p-8 flex flex-col items-center justify-center text-center gap-4 overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/40 via-accent/60 to-primary/40 rounded-t-[2rem]" />
              <span className="text-6xl">{current.emoji}</span>
              <p className="text-2xl font-serif text-foreground leading-snug">"{current.text}"</p>
              <p className="text-xs text-muted-foreground mt-2">
                {index + 1} of {AFFIRMATIONS.length}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex justify-center gap-2">
          {AFFIRMATIONS.map((_, itemIndex) => (
            <button
              key={itemIndex}
              onClick={() => {
                setDirection(itemIndex > index ? 1 : -1);
                setIndex(itemIndex);
              }}
              className={`h-2 rounded-full transition-all duration-300 ${
                itemIndex === index ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-4">
          <button
            onClick={prev}
            className="app-icon-button w-14 h-14"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={shuffle}
            className="app-button-primary flex-1 flex items-center justify-center gap-2 h-14 rounded-[2rem] text-base"
          >
            <RefreshCcw className="w-5 h-5" />
            Shuffle
          </button>

          <button
            onClick={next}
            className="app-icon-button w-14 h-14"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-3">
          <button
            onClick={() => void handleSaveCurrent()}
            className="app-button flex items-center justify-center gap-2 rounded-[1.5rem] border border-primary/20 bg-primary/10 text-primary transition-all hover:-translate-y-0.5 hover:bg-primary/15 hover:shadow-sm active:translate-y-0"
          >
            <Heart className="h-4 w-4" />
            {alreadySaved ? "Saved to your collection" : "Save this affirmation"}
          </button>
          <button
            onClick={shuffle}
            className="app-button-secondary rounded-[1.5rem] px-4"
          >
            New pick
          </button>
        </div>

        <div className="mt-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 px-1">All Affirmations</p>
          <div className="flex flex-col gap-2">
            {AFFIRMATIONS.map((affirmation, itemIndex) => (
              <motion.button
                key={itemIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: itemIndex * 0.04 }}
                onClick={() => {
                  setDirection(itemIndex > index ? 1 : -1);
                  setIndex(itemIndex);
                }}
                className={`flex items-center gap-3 p-4 rounded-2xl text-left transition-all duration-200 border ${
                  itemIndex === index
                    ? "bg-primary/10 border-primary/30 shadow-md"
                    : "bg-white border-border hover:bg-muted/50 hover:border-border hover:-translate-y-0.5 hover:shadow-md"
                }`}
              >
                <span className="text-2xl">{affirmation.emoji}</span>
                <span className={`text-sm font-medium ${itemIndex === index ? "text-primary" : "text-foreground"}`}>
                  {affirmation.text}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="app-card p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Save Your Own</p>
          <div className="flex gap-3">
            <textarea
              value={customAffirmation}
              onChange={(event) => setCustomAffirmation(event.target.value)}
              placeholder="Write an affirmation you want to keep close."
              className="min-h-[96px] flex-1 resize-none rounded-2xl bg-muted/30 p-4 text-sm text-foreground outline-none"
            />
            <button
              onClick={() => void handleSaveCustom()}
              disabled={!customAffirmation.trim()}
              className="app-button-primary flex h-12 w-12 items-center justify-center self-end px-0 disabled:opacity-40"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mt-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 px-1">Saved For You</p>
          {!isLoaded ? (
            <ContentState message="Loading affirmations..." loading />
          ) : affirmations.length === 0 ? (
            <ContentState message="No affirmations yet. Add one to get started." />
          ) : (
            <div className="flex flex-col gap-3">
              {affirmations.map((affirmation) => (
                <div key={affirmation.id} className="app-card-soft flex items-start justify-between gap-3 p-4">
                  <div>
                    <p className="text-xl">{affirmation.emoji ?? "✨"}</p>
                    <p className="mt-2 text-sm font-medium leading-relaxed text-foreground">{affirmation.text}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatFriendlyTimestamp(affirmation.created_at)}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">
                      {affirmation.source === "custom" ? "Custom" : "Saved from deck"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        void toggleFavorite(affirmation.id, !affirmation.is_favorite);
                      }}
                      className={`rounded-xl p-2 transition-colors ${
                        affirmation.is_favorite
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-primary/8 hover:text-primary"
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${affirmation.is_favorite ? "fill-current" : ""}`} />
                    </button>
                    <button
                      onClick={() => {
                        void deleteAffirmation(affirmation.id);
                      }}
                      className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
