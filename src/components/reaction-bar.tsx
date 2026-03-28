import { useMemo, useState } from "react";
import { HeartHandshake } from "lucide-react";
import { getReactionChoices, type ReactionItemType, type ReactionValue } from "@/hooks/use-reactions";

interface ReactionBarProps {
  itemType: ReactionItemType;
  itemId: string;
  getUserReaction: (itemType: ReactionItemType, itemId: string) => ReactionValue | null;
  getReactionCounts: (itemType: ReactionItemType, itemId: string) => Record<ReactionValue, number>;
  onToggleReaction: (itemType: ReactionItemType, itemId: string, reaction: ReactionValue) => void;
}

export function ReactionBar({
  itemType,
  itemId,
  getUserReaction,
  getReactionCounts,
  onToggleReaction,
}: ReactionBarProps) {
  const [expanded, setExpanded] = useState(false);
  const userReaction = getUserReaction(itemType, itemId);
  const counts = getReactionCounts(itemType, itemId);
  const choices = useMemo(() => getReactionChoices(), []);
  const visibleCounts = choices.filter((choice) => counts[choice] > 0);

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {visibleCounts.map((choice) => (
        <button
          key={choice}
          type="button"
          onClick={() => onToggleReaction(itemType, itemId, choice)}
          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            userReaction === choice
              ? "border-primary/25 bg-primary/10 text-primary"
              : "border-border/80 bg-white/85 text-muted-foreground hover:border-primary/20 hover:text-primary"
          }`}
        >
          <span>{choice}</span>
          <span>{counts[choice]}</span>
        </button>
      ))}

      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-white/85 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/20 hover:text-primary"
      >
        <HeartHandshake className="h-3.5 w-3.5" />
        {userReaction ? "Respond again" : "Respond softly"}
      </button>

      {expanded ? (
        <div className="flex flex-wrap items-center gap-2">
          {choices.map((choice) => (
            <button
              key={choice}
              type="button"
              onClick={() => {
                onToggleReaction(itemType, itemId, choice);
                setExpanded(false);
              }}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                userReaction === choice
                  ? "border-primary/25 bg-primary/10 text-primary"
                  : "border-border/80 bg-white/85 text-muted-foreground hover:border-primary/20 hover:text-primary"
              }`}
            >
              {choice}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
