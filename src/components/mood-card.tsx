import { Link } from "wouter";
import { Heart, MessageCircleHeart, NotebookPen, Send } from "lucide-react";
import type { MoodCheckin, MoodValue } from "@/hooks/use-mood-checkin";

const OPTIONS: Array<{ mood: MoodValue; emoji: string; label: string }> = [
  { mood: "good", emoji: "😊", label: "Good" },
  { mood: "okay", emoji: "😐", label: "Okay" },
  { mood: "not_great", emoji: "😔", label: "Not great" },
  { mood: "need_to_talk", emoji: "💭", label: "Need to talk" },
];

export function MoodCard({
  todayCheckin,
  shareMood,
  onToggleShareMood,
  onSelectMood,
  isSaving,
  canShareMood,
  activePartnerLabel,
  dailyAffirmation,
  journalHref,
  noteHref,
  shareHref,
  directHref,
}: {
  todayCheckin: MoodCheckin | null;
  shareMood: boolean;
  onToggleShareMood: (nextValue: boolean) => void;
  onSelectMood: (mood: MoodValue) => void;
  isSaving: boolean;
  canShareMood: boolean;
  activePartnerLabel: string | null;
  dailyAffirmation: string;
  journalHref: string;
  noteHref: string;
  shareHref: string;
  directHref: string;
}) {
  const selectedMood = todayCheckin?.mood ?? null;

  return (
    <section className="app-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Daily Check-In</p>
          <h2 className="mt-2 text-2xl font-serif text-foreground">How are you feeling today? 💛</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            One gentle tap is enough. You can keep it private, or let {activePartnerLabel ?? "someone close"} know
            you may need them.
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {OPTIONS.map((option) => {
          const active = option.mood === selectedMood;
          return (
            <button
              key={option.mood}
              type="button"
              onClick={() => onSelectMood(option.mood)}
              disabled={isSaving}
              className={`rounded-[1.35rem] border px-4 py-4 text-left shadow-sm transition-all duration-200 ${
                active
                  ? "border-primary/25 bg-primary/10 text-foreground"
                  : "border-border/75 bg-white/82 text-foreground hover:-translate-y-0.5 hover:border-primary/20 hover:bg-white"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <p className="text-lg">{option.emoji}</p>
              <p className="mt-2 text-sm font-semibold">{option.label}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-[1.2rem] border border-border/70 bg-muted/28 px-4 py-3">
        <label
          className={`flex items-center justify-between gap-3 text-sm ${
            canShareMood ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          <div>
            <p className="font-semibold">Share how I feel</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {canShareMood
                ? `If you turn this on, ${activePartnerLabel ?? "your connection"} will get a gentle heads-up if needed.`
                : "Connect first if you want to share your mood softly with someone."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => canShareMood && onToggleShareMood(!shareMood)}
            disabled={!canShareMood}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
              shareMood && canShareMood ? "bg-primary" : "bg-border"
            } disabled:cursor-not-allowed disabled:opacity-50`}
            aria-pressed={shareMood}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                shareMood && canShareMood ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </label>
      </div>

      {selectedMood === "good" ? (
        <div className="mt-4 rounded-[1.25rem] border border-primary/15 bg-primary/8 px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80">A soft affirmation</p>
          <p className="mt-2 text-sm leading-6 text-foreground">{dailyAffirmation}</p>
        </div>
      ) : null}

      {selectedMood === "okay" ? (
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href={journalHref}>
            <span className="app-button-secondary inline-flex cursor-pointer items-center gap-2">
              <NotebookPen className="h-4 w-4 text-primary" />
              Write in Journal
            </span>
          </Link>
          <Link href={noteHref}>
            <span className="app-button-secondary inline-flex cursor-pointer items-center gap-2">
              <Heart className="h-4 w-4 text-primary" />
              Create a Note
            </span>
          </Link>
        </div>
      ) : null}

      {selectedMood === "not_great" ? (
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href={shareHref}>
            <span className="app-button-secondary inline-flex cursor-pointer items-center gap-2">
              <MessageCircleHeart className="h-4 w-4 text-primary" />
              Share with Mom/Daughter
            </span>
          </Link>
          <Link href={journalHref}>
            <span className="app-button-secondary inline-flex cursor-pointer items-center gap-2">
              <NotebookPen className="h-4 w-4 text-primary" />
              Write it out
            </span>
          </Link>
        </div>
      ) : null}

      {selectedMood === "need_to_talk" ? (
        <div className="mt-4">
          <Link href={directHref}>
            <span className="app-button-primary inline-flex cursor-pointer items-center gap-2">
              <Send className="h-4 w-4" />
              Open Direct Messages
            </span>
          </Link>
        </div>
      ) : null}
    </section>
  );
}
