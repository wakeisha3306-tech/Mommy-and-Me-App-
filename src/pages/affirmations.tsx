import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCcw, Heart, Plus, Trash2, Share2, Sparkles } from "lucide-react";
import { ShareMomentDialog } from "@/components/share-moment-dialog";
import { Layout } from "@/components/layout";
import { ContentState } from "@/components/content-state";
import { useAffirmations } from "@/hooks/use-affirmations";
import { toast } from "@/hooks/use-toast";
import { PRESET_AFFIRMATIONS } from "@/lib/affirmations";
import { SHARE_CARD_TAGLINE } from "@/lib/brand";
import type { ShareCardContent } from "@/lib/share-card";
import { formatFriendlyTimestamp } from "@/lib/utils";

export default function Affirmations() {
  const { affirmations, isLoaded, addAffirmation, deleteAffirmation, toggleFavorite } = useAffirmations();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [customAffirmation, setCustomAffirmation] = useState("");
  const [shareItem, setShareItem] = useState<ShareCardContent | null>(null);
  const [rotationPool, setRotationPool] = useState<number[]>([]);

  const shuffledIndices = useCallback((excludeIndex?: number) => {
    const indices = PRESET_AFFIRMATIONS.map((_, itemIndex) => itemIndex).filter((itemIndex) => itemIndex !== excludeIndex);

    for (let currentIndex = indices.length - 1; currentIndex > 0; currentIndex -= 1) {
      const randomIndex = Math.floor(Math.random() * (currentIndex + 1));
      [indices[currentIndex], indices[randomIndex]] = [indices[randomIndex], indices[currentIndex]];
    }

    return indices;
  }, []);

  const generateAnother = useCallback(() => {
    setDirection(1);
    setRotationPool((currentPool) => {
      const nextPool = currentPool.length > 0 ? currentPool : shuffledIndices(index);
      const [nextIndex, ...remainingPool] = nextPool;

      if (typeof nextIndex === "number") {
        setIndex(nextIndex);
      }

      return remainingPool;
    });
  }, [index, shuffledIndices]);

  const current = PRESET_AFFIRMATIONS[index];
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
      description: success ? "You can return to it anytime." : "Please try again in a moment.",
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
      description: success ? "Your own words are now part of your collection." : "Please try again in a moment.",
    });
  };

  return (
    <Layout title="Affirmations" subtitle="Words that meet you with comfort, truth, and care">
      <div className="mt-4 flex-1 section-stack">
        <ShareMomentDialog item={shareItem} onClose={() => setShareItem(null)} />

        <div className="relative flex h-80 items-center justify-center">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={index}
              custom={direction}
              initial={{ opacity: 0, x: direction * 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: direction * -60, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="app-card absolute inset-0 flex flex-col items-center justify-center gap-5 overflow-hidden p-8 text-center"
            >
              <div className="absolute left-0 right-0 top-0 h-1 rounded-t-[2rem] bg-gradient-to-r from-primary/40 via-accent/60 to-primary/40" />
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-7 w-7" />
              </div>
              <p className="text-2xl font-serif leading-snug text-foreground">"{current.text}"</p>
              <p className="rounded-full bg-primary/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                {current.theme}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <button
          onClick={generateAnother}
          className="app-button-primary flex h-14 w-full items-center justify-center gap-2 rounded-[2rem] text-base"
        >
          <RefreshCcw className="h-5 w-5" />
          Generate another affirmation
        </button>

        <div className="grid grid-cols-[1fr_auto] gap-3">
          <button
            onClick={() => void handleSaveCurrent()}
            className="app-button flex items-center justify-center gap-2 rounded-[1.5rem] border border-primary/20 bg-primary/10 text-primary transition-all hover:-translate-y-0.5 hover:bg-primary/15 hover:shadow-sm active:translate-y-0"
          >
            <Heart className="h-4 w-4" />
            {alreadySaved ? "Saved to your collection" : "Save this affirmation"}
          </button>
          <button
            onClick={() =>
              setShareItem({
                label: "Affirmation",
                text: current.text,
                tagline: SHARE_CARD_TAGLINE,
              })
            }
            className="app-button rounded-[1.5rem] border border-primary/15 bg-white/85 px-4 text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white"
          >
            <span className="inline-flex items-center gap-2">
              <Share2 className="h-4 w-4 text-primary" />
              Share 💛
            </span>
          </button>
        </div>

        <div className="app-card p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Save Your Own</p>
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
          <p className="mb-3 px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Saved For You</p>
          {!isLoaded ? (
            <ContentState message="Loading affirmations..." loading />
          ) : affirmations.length === 0 ? (
            <ContentState message="Your affirmation shelf is still quiet. Save one that feels like a breath you want to keep nearby." />
          ) : (
            <div className="flex flex-col gap-3">
              {affirmations.map((affirmation) => (
                <div key={affirmation.id} className="app-card-soft flex items-start justify-between gap-3 p-4">
                  <div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <p className="mt-2 text-sm font-medium leading-relaxed text-foreground">{affirmation.text}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{formatFriendlyTimestamp(affirmation.created_at)}</p>
                    <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">
                      {affirmation.source === "custom" ? "Custom" : "Saved from library"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        setShareItem({
                          label: "Affirmation",
                          text: affirmation.text,
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
