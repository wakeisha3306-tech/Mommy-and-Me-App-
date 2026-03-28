import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Bell, BookHeart, MessageCircleHeart, Sparkles, Star, Users } from "lucide-react";
import { Layout } from "@/components/layout";
import { MoodCard } from "@/components/mood-card";
import { ShareMomentDialog } from "@/components/share-moment-dialog";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { useAffirmations } from "@/hooks/use-affirmations";
import { useConnection } from "@/hooks/use-connection";
import { NEED_TO_TALK_MESSAGE, useDirectMessages } from "@/hooks/use-direct-messages";
import { useJournal } from "@/hooks/use-journal";
import { useMoodCheckin, type MoodValue } from "@/hooks/use-mood-checkin";
import { useNotes } from "@/hooks/use-notes";
import { useRealMoments } from "@/hooks/use-real-moments";
import { APP_NAME, APP_TAGLINE, SHARE_CARD_TAGLINE } from "@/lib/brand";
import { getDailyAffirmation } from "@/lib/affirmations";
import type { ShareCardContent } from "@/lib/share-card";
import { formatFriendlyTimestamp, getUserLabel } from "@/lib/utils";

type WaitingItem = {
  id: string;
  title: string;
  body: string;
  href: string;
  kind: "alert" | "message" | "between_us" | "family" | "memory";
  onOpen?: () => Promise<void> | void;
};

const DAILY_PROMPTS = [
  "What felt tender or meaningful between you lately?",
  "What is one small thing you wish they understood today?",
  "What made you feel cared for this week?",
  "What is one truth your heart wants to say gently?",
];

const WAITING_STORAGE_KEY = "between-us-last-viewed-waiting";
const WELCOME_STORAGE_KEY = "between-us-show-welcome";

export default function Home() {
  const [, navigate] = useLocation();
  const { session, profile } = useAuth();
  const { entries } = useJournal();
  const { affirmations } = useAffirmations();
  const { moments, addMoment } = useRealMoments();
  const {
    notes,
    privateNotes,
    betweenUsNotes,
    familyNotes,
    latestReceivedBetweenUsNote,
    latestReceivedFamilyNote,
  } = useNotes();
  const { latestReceivedMessage } = useDirectMessages();
  const { connection, partnerRole } = useConnection();
  const { todayCheckin, latestAlert, isSaving, saveCheckin, markAlertViewed } = useMoodCheckin();

  const [shareMood, setShareMood] = useState(todayCheckin?.shared ?? false);
  const [realMomentDraft, setRealMomentDraft] = useState("");
  const [isSavingMoment, setIsSavingMoment] = useState(false);
  const [shareItem, setShareItem] = useState<ShareCardContent | null>(null);
  const [dismissedWaitingId, setDismissedWaitingId] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    setShareMood(todayCheckin?.shared ?? false);
  }, [todayCheckin?.shared]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDismissedWaitingId(window.localStorage.getItem(WAITING_STORAGE_KEY));
    setShowWelcome(window.localStorage.getItem(WELCOME_STORAGE_KEY) === "true");
  }, []);

  const displayName = getUserLabel(profile?.display_name, session?.user.email);
  const firstName = displayName.split(" ")[0] ?? displayName;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const activePartnerLabel = useMemo(
    () => getUserLabel(connection?.partner_name, connection?.partner_email ?? undefined),
    [connection?.partner_email, connection?.partner_name],
  );
  const partnerLabel = activePartnerLabel ?? partnerRole ?? "your person";
  const dailyAffirmation = getDailyAffirmation();
  const dailyPrompt = DAILY_PROMPTS[Math.floor(Date.now() / 86400000) % DAILY_PROMPTS.length];

  const journalHref = `/journal?prompt=${encodeURIComponent("Here is what I want to hold from today...")}`;
  const noteHref = `/notes?tab=private&prompt=${encodeURIComponent("A little note I want to keep close...")}`;
  const shareHref = connection?.partner_id
    ? `/notes?tab=between_us&prompt=${encodeURIComponent("I am having a tender day and wanted to share that with you 💛")}`
    : "/connect";
  const directHref = connection?.partner_id
    ? `/notes?tab=direct&prompt=${encodeURIComponent(NEED_TO_TALK_MESSAGE)}`
    : "/connect";

  const favoriteMoments = useMemo(() => {
    const items: Array<{ id: string; kind: string; text: string; created_at: string }> = [];

    for (const entry of entries.filter((item) => item.is_favorite)) {
      items.push({ id: `journal-${entry.id}`, kind: "Journal", text: entry.text, created_at: entry.created_at });
    }

    for (const affirmation of affirmations.filter((item) => item.is_favorite)) {
      items.push({
        id: `affirmation-${affirmation.id}`,
        kind: "Affirmation",
        text: affirmation.text,
        created_at: affirmation.created_at,
      });
    }

    for (const note of notes.filter((item) => item.is_favorite)) {
      items.push({ id: `note-${note.id}`, kind: "Note", text: note.text, created_at: note.created_at });
    }

    return items
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3);
  }, [affirmations, entries, notes]);

  const resurfacedMoment = useMemo(() => {
    const candidates = [
      ...entries.map((entry) => ({
        text: entry.text,
        created_at: entry.created_at,
        href: "/journal",
        label: "From your journal",
      })),
      ...privateNotes.map((note) => ({
        text: note.text,
        created_at: note.created_at,
        href: "/notes?tab=private",
        label: "From My Space",
      })),
      ...moments.map((moment) => ({
        text: moment.text,
        created_at: moment.created_at,
        href: "/",
        label: "From Little Moments",
      })),
    ]
      .filter((item) => {
        const ageMs = Date.now() - new Date(item.created_at).getTime();
        return ageMs > 86400000 && ageMs < 1000 * 60 * 60 * 24 * 10;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (candidates.length === 0) return null;
    if (Math.floor(Date.now() / 86400000) % 3 !== 0) return null;
    return candidates[0];
  }, [entries, moments, privateNotes]);

  const waitingItem = useMemo<WaitingItem | null>(() => {
    if (latestAlert) {
      return {
        id: `alert-${latestAlert.id}`,
        kind: "alert",
        title: "You have something waiting 💛",
        body: "She might need you today 💛",
        href: `/notes?tab=direct&partner=${encodeURIComponent(latestAlert.sender_id)}`,
        onOpen: async () => {
          await markAlertViewed(latestAlert.id);
        },
      };
    }

    if (latestReceivedMessage) {
      return {
        id: `message-${latestReceivedMessage.id}`,
        kind: "message",
        title: "You have something waiting 💛",
        body: `You received a message from ${latestReceivedMessage.sender_role} 💛`,
        href: `/notes?tab=direct&partner=${encodeURIComponent(latestReceivedMessage.sender_id)}`,
      };
    }

    if (latestReceivedBetweenUsNote) {
      return {
        id: `between-${latestReceivedBetweenUsNote.id}`,
        kind: "between_us",
        title: "You have something waiting 💛",
        body: `You received something from ${latestReceivedBetweenUsNote.author} 💛`,
        href: `/notes?tab=between_us&partner=${encodeURIComponent(latestReceivedBetweenUsNote.user_id)}`,
      };
    }

    if (latestReceivedFamilyNote) {
      return {
        id: `family-${latestReceivedFamilyNote.id}`,
        kind: "family",
        title: "You have something waiting 💛",
        body: "There is something new in Family Space 💛",
        href: "/notes?tab=family",
      };
    }

    if (resurfacedMoment) {
      return {
        id: `memory-${resurfacedMoment.created_at}`,
        kind: "memory",
        title: "You have something waiting 💛",
        body: "You wrote this recently 💛",
        href: resurfacedMoment.href,
      };
    }

    return null;
  }, [
    latestAlert,
    latestReceivedBetweenUsNote,
    latestReceivedFamilyNote,
    latestReceivedMessage,
    markAlertViewed,
    resurfacedMoment,
  ]);

  const visibleWaitingItem = waitingItem && waitingItem.id !== dismissedWaitingId ? waitingItem : null;

  const handleMoodSelect = async (mood: MoodValue) => {
    const result = await saveCheckin(mood, shareMood && Boolean(connection?.partner_id), connection?.partner_id);
    if (result.error) {
      toast({
        title: "Couldn't save your check-in",
        description: result.error,
      });
      return;
    }

    if (mood === "need_to_talk") {
      navigate(directHref);
      return;
    }

    if (mood === "not_great" && shareMood && connection?.partner_id) {
      toast({
        title: "A gentle heads-up was shared",
        description: `${partnerLabel} will see a soft note that you may need them today.`,
      });
    }
  };

  const handleOpenWaiting = async () => {
    if (!visibleWaitingItem) return;

    if (visibleWaitingItem.onOpen) {
      await visibleWaitingItem.onOpen();
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(WAITING_STORAGE_KEY, visibleWaitingItem.id);
    }
    setDismissedWaitingId(visibleWaitingItem.id);
    navigate(visibleWaitingItem.href);
  };

  const handleSaveRealMoment = async () => {
    if (!realMomentDraft.trim()) return;

    setIsSavingMoment(true);
    const success = await addMoment(realMomentDraft);
    setIsSavingMoment(false);

    if (!success) {
      toast({
        title: "Couldn't save that moment",
        description: "Please try again in a moment.",
      });
      return;
    }

    setRealMomentDraft("");
    toast({
      title: "Saved to Little Moments",
      description: "A small real-life memory is now tucked into your space.",
    });
  };

  const dismissWelcome = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(WELCOME_STORAGE_KEY);
    }
    setShowWelcome(false);
  };

  return (
    <Layout>
      <ShareMomentDialog item={shareItem} onClose={() => setShareItem(null)} />

      <div className="section-stack">
        {showWelcome ? (
          <section className="app-feature-card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/75">Welcome</p>
            <h2 className="mt-3 text-3xl font-serif leading-tight text-foreground">This is your space.</h2>
            <p className="mt-3 text-sm leading-7 text-foreground/88">
              A place to be heard, supported, and close - no matter what.
            </p>
            <button type="button" onClick={dismissWelcome} className="app-button-primary mt-5">
              Enter Between Us
            </button>
          </section>
        ) : null}

        <section className="app-card-soft p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/75">{APP_NAME}</p>
          <h1 className="mt-3 text-3xl font-serif leading-tight text-foreground">
            {greeting}, {firstName}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{APP_TAGLINE}</p>
          <p className="mt-4 text-sm leading-6 text-foreground/88">
            A gentle place for private thoughts, shared notes, and quiet connection that stays intentional.
          </p>
        </section>

        <MoodCard
          todayCheckin={todayCheckin}
          shareMood={shareMood}
          onToggleShareMood={setShareMood}
          onSelectMood={(mood) => void handleMoodSelect(mood)}
          isSaving={isSaving}
          canShareMood={Boolean(connection?.partner_id)}
          activePartnerLabel={activePartnerLabel}
          dailyAffirmation={dailyAffirmation.text}
          journalHref={journalHref}
          noteHref={noteHref}
          shareHref={shareHref}
          directHref={directHref}
        />

        {visibleWaitingItem ? (
          <button
            type="button"
            onClick={() => void handleOpenWaiting()}
            className="app-card flex w-full items-center justify-between gap-4 border-primary/15 bg-primary/8 p-4 text-left transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-white/80 p-2 text-primary shadow-sm">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{visibleWaitingItem.title}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{visibleWaitingItem.body}</p>
              </div>
            </div>
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Open</span>
          </button>
        ) : null}

        {resurfacedMoment && (!visibleWaitingItem || visibleWaitingItem.kind !== "memory") ? (
          <section className="app-card p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">Memory Resurfacing</p>
            <h2 className="mt-2 text-xl font-serif text-foreground">You wrote this recently 💛</h2>
            <p className="mt-3 text-sm leading-6 text-foreground">{resurfacedMoment.text}</p>
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">{resurfacedMoment.label}</p>
              <Link href={resurfacedMoment.href} className="text-sm font-semibold text-primary">
                Visit it
              </Link>
            </div>
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2">
          <div className="app-card p-5">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-[0.18em]">Daily Affirmation</p>
            </div>
            <p className="mt-3 text-lg font-serif leading-snug text-foreground">{dailyAffirmation.text}</p>
            <Link href="/affirmations" className="mt-4 inline-flex text-sm font-semibold text-primary">
              Generate another affirmation
            </Link>
          </div>

          <div className="app-card p-5">
            <div className="flex items-center gap-2 text-primary">
              <BookHeart className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-[0.18em]">Daily Connection Prompt</p>
            </div>
            <p className="mt-3 text-lg font-serif leading-snug text-foreground">{dailyPrompt}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href={`/journal?prompt=${encodeURIComponent(dailyPrompt)}`} className="app-button-secondary">
                Reflect in Journal
              </Link>
              <Link href={`/notes?tab=between_us&prompt=${encodeURIComponent(dailyPrompt)}`} className="app-button-secondary">
                Turn into a Note
              </Link>
            </div>
          </div>
        </section>

        <section className="app-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">Shared Snapshot</p>
              <h2 className="mt-2 text-xl font-serif text-foreground">A gentle view of your space</h2>
            </div>
            <Users className="h-5 w-5 text-primary/70" />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-[1.2rem] bg-muted/35 px-4 py-4 text-center">
              <p className="text-2xl font-serif text-foreground">{entries.length}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">Journal</p>
            </div>
            <div className="rounded-[1.2rem] bg-muted/35 px-4 py-4 text-center">
              <p className="text-2xl font-serif text-foreground">{betweenUsNotes.length + familyNotes.length}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">Shared</p>
            </div>
            <div className="rounded-[1.2rem] bg-muted/35 px-4 py-4 text-center">
              <p className="text-2xl font-serif text-foreground">{moments.length}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">Moments</p>
            </div>
          </div>
        </section>

        <section className="app-card p-5">
          <div className="flex items-center gap-2 text-primary">
            <MessageCircleHeart className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em]">Little Moments</p>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Short, real-life pieces of the day. Slightly funny. Slightly tender. Fully yours.
          </p>
          <textarea
            value={realMomentDraft}
            onChange={(event) => setRealMomentDraft(event.target.value)}
            maxLength={180}
            placeholder="She rolled her eyes at me, then brought me a snack anyway."
            className="mt-4 min-h-[90px] w-full resize-none rounded-2xl bg-muted/30 p-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">{realMomentDraft.length}/180</p>
            <button
              type="button"
              onClick={() => void handleSaveRealMoment()}
              disabled={!realMomentDraft.trim() || isSavingMoment}
              className="app-button-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSavingMoment ? "Saving..." : "Save moment"}
            </button>
          </div>

          {moments.length > 0 ? (
            <div className="mt-4 space-y-3">
              {moments.slice(0, 3).map((moment) => (
                <div key={moment.id} className="rounded-[1.2rem] border border-border/70 bg-white/80 px-4 py-4">
                  <p className="text-sm leading-6 text-foreground">{moment.text}</p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">{formatFriendlyTimestamp(moment.created_at)}</p>
                    <button
                      type="button"
                      onClick={() =>
                        setShareItem({
                          label: "Little Moment",
                          text: moment.text,
                          tagline: SHARE_CARD_TAGLINE,
                        })
                      }
                      className="text-sm font-semibold text-primary"
                    >
                      Share 💛
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        {favoriteMoments.length > 0 ? (
          <section className="app-card p-5">
            <div className="flex items-center gap-2 text-primary">
              <Star className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-[0.18em]">Favorite Moments</p>
            </div>
            <div className="mt-4 space-y-3">
              {favoriteMoments.map((moment) => (
                <div key={moment.id} className="rounded-[1.2rem] border border-border/70 bg-white/80 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/75">{moment.kind}</p>
                  <p className="mt-2 text-sm leading-6 text-foreground">{moment.text}</p>
                  <p className="mt-3 text-xs text-muted-foreground">{formatFriendlyTimestamp(moment.created_at)}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="grid gap-3 md:grid-cols-3">
          <Link href="/journal" className="app-card-soft p-4">
            <p className="text-sm font-semibold text-foreground">Journal</p>
            <p className="mt-1 text-sm text-muted-foreground">Write it out softly.</p>
          </Link>
          <Link href="/notes" className="app-card-soft p-4">
            <p className="text-sm font-semibold text-foreground">Notes</p>
            <p className="mt-1 text-sm text-muted-foreground">Choose My Space, Between Us, or Direct Messages.</p>
          </Link>
          <Link href="/settings" className="app-card-soft p-4">
            <p className="text-sm font-semibold text-foreground">Settings</p>
            <p className="mt-1 text-sm text-muted-foreground">Manage connection and account care.</p>
          </Link>
        </section>
      </div>
    </Layout>
  );
}

