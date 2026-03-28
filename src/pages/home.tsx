import { useMemo, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Sparkles, BookHeart, MessageCircleHeart, ChevronRight, ChevronLeft, HeartHandshake, NotebookPen, MessagesSquare, SunMedium, Heart, PenSquare, Send } from "lucide-react";
import { format } from "date-fns";
import { Layout } from "@/components/layout";
import { useAuth } from "@/context/auth-context";
import { useJournal } from "@/hooks/use-journal";
import { useAffirmations } from "@/hooks/use-affirmations";
import { useNotes } from "@/hooks/use-notes";
import { formatFriendlyTimestamp, getUserLabel } from "@/lib/utils";

const DAILY_AFFIRMATIONS = [
  "I am strong and capable 💪🏽",
  "I am loved and appreciated 💕",
  "I can get through anything 🌸",
  "My voice matters 🗣️",
  "I am growing every day 🌱",
  "I am enough, exactly as I am ✨",
  "My love creates a safe place 🏡",
  "I am raising something beautiful 🌟",
];

function getDailyAffirmation() {
  const dayIndex = Math.floor(Date.now() / 86400000) % DAILY_AFFIRMATIONS.length;
  return DAILY_AFFIRMATIONS[dayIndex];
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const QUOTES = [
  {
    text: "You may not control all the events that happen to you, but you can decide not to be reduced by them.",
    author: "Maya Angelou",
  },
  {
    text: "When they go low, we go high.",
    author: "Michelle Obama",
  },
  {
    text: "I was the conductor of the Underground Railroad for eight years, and I can say what most conductors can't say - I never ran my train off the track and I never lost a passenger.",
    author: "Harriet Tubman",
  },
  {
    text: "I am not free while any woman is unfree, even when her shackles are very different from my own.",
    author: "Audre Lorde",
  },
  {
    text: "The time is always right to do what is right.",
    author: "Coretta Scott King",
  },
  {
    text: "If you have some power, then your job is to empower somebody else.",
    author: "Toni Morrison",
  },
  {
    text: "We need to reshape our own perception of how we view ourselves. We have to step up as women and take the lead.",
    author: "Beyonce",
  },
  {
    text: "Think like a queen. A queen is not afraid to fail. Failure is another stepping stone to greatness.",
    author: "Oprah Winfrey",
  },
  {
    text: "I am no longer accepting the things I cannot change. I am changing the things I cannot accept.",
    author: "Angela Davis",
  },
  {
    text: "Love takes off the masks that we fear we cannot live without and know we cannot live within.",
    author: "James Baldwin",
  },
];

const QUICK_LINKS = [
  {
    href: "/affirmations",
    icon: Sparkles,
    label: "Daily Affirmations",
    description: "Words to carry you through",
    color: "bg-primary/10 text-primary",
    activeBg: "hover:bg-primary/15",
  },
  {
    href: "/journal",
    icon: BookHeart,
    label: "My Journal",
    description: "A space for your thoughts",
    color: "bg-accent/15 text-accent-foreground",
    activeBg: "hover:bg-accent/20",
  },
  {
    href: "/notes",
    icon: MessageCircleHeart,
    label: "Our Notes",
    description: "Messages between us",
    color: "bg-secondary text-secondary-foreground",
    activeBg: "hover:bg-secondary/80",
  },
];

const DAILY_RITUALS = [
  {
    title: "Start with one gentle truth",
    body: "Pick one loving thought to carry with you today, even if everything else feels busy.",
    actions: [
      { href: "/affirmations", label: "Pick an affirmation" },
      { href: "/journal", label: "Write a quick check-in" },
      { href: "/notes", label: "Send a soft note" },
    ],
  },
  {
    title: "Make space for a small moment",
    body: "A few honest words or one kind note can turn the whole day around.",
    actions: [
      { href: "/notes", label: "Share a message" },
      { href: "/journal", label: "Capture the feeling" },
      { href: "/affirmations", label: "Save encouragement" },
    ],
  },
  {
    title: "Let today feel held",
    body: "You don't need a perfect plan. Just one meaningful moment together is enough.",
    actions: [
      { href: "/journal", label: "Reflect for a minute" },
      { href: "/affirmations", label: "Choose steady words" },
      { href: "/notes", label: "Leave love behind" },
    ],
  },
];

const DAILY_CONNECTION_PROMPTS = [
  "What is one thing you want each other to remember today?",
  "What made you feel most loved lately?",
  "What would make today feel a little softer for you?",
  "What is one small win you want to celebrate together?",
  "What do you want to say thank you for today?",
  "What feeling deserves a little more space right now?",
  "What is one memory you never want to lose?",
  "What would help you feel supported today?",
];

function getDailyRitual() {
  const dayIndex = Math.floor(Date.now() / 86400000) % DAILY_RITUALS.length;
  return DAILY_RITUALS[dayIndex];
}

function getDailyConnectionPrompt() {
  const dayIndex = Math.floor(Date.now() / 86400000) % DAILY_CONNECTION_PROMPTS.length;
  return DAILY_CONNECTION_PROMPTS[dayIndex];
}

export default function Home() {
  const { session, profile } = useAuth();
  const { entries, isLoaded: journalLoaded } = useJournal();
  const { affirmations, isLoaded: affirmationsLoaded } = useAffirmations();
  const { notes, isLoaded: notesLoaded } = useNotes();
  const affirmation = useMemo(getDailyAffirmation, []);
  const ritual = useMemo(getDailyRitual, []);
  const connectionPrompt = useMemo(getDailyConnectionPrompt, []);
  const greeting = useMemo(getGreeting, []);
  const displayName = useMemo(
    () => getUserLabel(profile?.display_name, session?.user.email),
    [profile?.display_name, session?.user.email],
  );
  const todayLabel = useMemo(() => format(new Date(), "EEEE, MMMM d"), []);
  const allMomentsLoaded = journalLoaded && affirmationsLoaded && notesLoaded;
  const totalMoments = entries.length + affirmations.length + notes.length;
  const favoriteMoments = useMemo(() => {
    const favorites = [
      ...entries
        .filter((entry) => entry.is_favorite)
        .map((entry) => ({
          id: `journal-${entry.id}`,
          type: "Journal",
          href: "/journal",
          text: entry.text,
          meta: entry.author,
          created_at: entry.created_at,
        })),
      ...affirmations
        .filter((affirmation) => affirmation.is_favorite)
        .map((affirmation) => ({
          id: `affirmation-${affirmation.id}`,
          type: "Affirmation",
          href: "/affirmations",
          text: affirmation.text,
          meta: affirmation.source === "custom" ? "Custom" : "Saved from deck",
          created_at: affirmation.created_at,
        })),
      ...notes
        .filter((note) => note.is_favorite)
        .map((note) => ({
          id: `note-${note.id}`,
          type: "Note",
          href: "/notes",
          text: note.text,
          meta: note.author,
          created_at: note.created_at,
        })),
    ];

    return favorites
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 4);
  }, [affirmations, entries, notes]);
  const latestMoment = useMemo(() => {
    const items = [
      entries[0] ? { label: "Journal", created_at: entries[0].created_at } : null,
      affirmations[0] ? { label: "Affirmation", created_at: affirmations[0].created_at } : null,
      notes[0] ? { label: "Note", created_at: notes[0].created_at } : null,
    ].filter(Boolean) as Array<{ label: string; created_at: string }>;

    return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] ?? null;
  }, [affirmations, entries, notes]);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const prevQuote = () => setQuoteIndex((i) => (i - 1 + QUOTES.length) % QUOTES.length);
  const nextQuote = () => setQuoteIndex((i) => (i + 1) % QUOTES.length);

  return (
    <Layout>
      <div className="section-stack pb-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="pt-10 flex items-center gap-4"
        >
          <div className="relative">
            <img
              src={`${import.meta.env.BASE_URL}images/mom-baby-art.png`}
              alt="Mother and child"
              className="w-20 h-20 rounded-full object-cover shadow-md border-2 border-white"
            />
            <div className="absolute inset-0 rounded-full ring-2 ring-primary/30" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-medium text-foreground leading-tight">
              {greeting}, <span className="text-primary">{displayName}</span>
            </p>
            <h1 className="mt-1 text-3xl font-serif text-foreground leading-tight">Mommy & Me 💕</h1>
            <p className="text-sm text-muted-foreground mt-1">A safe space, just for us.</p>
          </div>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08 }}
          className="app-feature-card p-6"
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between gap-3">
              <span className="app-mini-pill">Today together</span>
              <span className="text-xs font-medium text-muted-foreground">{todayLabel}</span>
            </div>

            <div className="mt-5 flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                <HeartHandshake className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-serif leading-tight text-foreground">{ritual.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{ritual.body}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {ritual.actions.map((action) => (
                <Link key={action.href} href={action.href}>
                  <span className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-primary/12 bg-white/84 px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:bg-white">
                    <SunMedium className="h-4 w-4 text-primary" />
                    {action.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Link href="/affirmations">
            <div className="relative overflow-hidden rounded-[1.9rem] bg-gradient-to-br from-primary to-primary/80 p-7 shadow-lg cursor-pointer group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/8 rounded-full translate-y-8 -translate-x-4 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-white/80" />
                  <span className="text-xs text-white/80 font-medium uppercase tracking-widest">Today's Affirmation</span>
                </div>
                <p className="text-white text-xl font-serif leading-snug">"{affirmation}"</p>
                <div className="flex items-center gap-1 mt-4 text-white/70 text-xs group-hover:text-white/90 transition-colors">
                  <span>See more</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.16 }}
          className="app-card p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Shared Snapshot</p>
              <h2 className="mt-2 text-2xl font-serif text-foreground">Your space in bloom</h2>
            </div>
            <div className="rounded-2xl bg-primary/10 px-4 py-3 text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/80">Moments kept</p>
              <p className="mt-1 text-2xl font-serif text-primary">{totalMoments}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="app-stat-tile">
              <NotebookPen className="h-4 w-4 text-primary" />
              <p className="mt-3 text-2xl font-serif text-foreground">{entries.length}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">Journal</p>
            </div>
            <div className="app-stat-tile">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="mt-3 text-2xl font-serif text-foreground">{affirmations.length}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">Affirmations</p>
            </div>
            <div className="app-stat-tile">
              <MessagesSquare className="h-4 w-4 text-primary" />
              <p className="mt-3 text-2xl font-serif text-foreground">{notes.length}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">Notes</p>
            </div>
          </div>

          <div className="mt-4 rounded-[1.35rem] border border-border/70 bg-muted/28 px-4 py-3">
            {!allMomentsLoaded ? (
              <p className="text-sm text-muted-foreground">Gathering your latest moments...</p>
            ) : latestMoment ? (
              <p className="text-sm text-muted-foreground">
                Latest moment: <span className="font-semibold text-foreground">{latestMoment.label}</span>{" "}
                {formatFriendlyTimestamp(latestMoment.created_at)}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Your first saved moment will show up here and make this space feel even more yours.
              </p>
            )}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.2 }}
          className="app-feature-card p-5"
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Daily Connection Prompt</p>
                <h2 className="mt-2 text-2xl font-serif text-foreground">A little question to bring you closer</h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-primary shadow-sm">
                <HeartHandshake className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-4 rounded-[1.45rem] border border-white/75 bg-white/84 p-5 shadow-sm">
              <p className="text-lg font-serif leading-relaxed text-foreground">"{connectionPrompt}"</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Answer it in your journal, or send it as a note to keep the conversation going.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link href={`/journal?prompt=${encodeURIComponent(connectionPrompt)}`}>
                <div className="flex cursor-pointer items-center justify-center gap-2 rounded-[1.35rem] border border-primary/15 bg-white/82 px-4 py-3 text-sm font-semibold text-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white">
                  <PenSquare className="h-4 w-4 text-primary" />
                  Reflect in Journal
                </div>
              </Link>
              <Link href={`/notes?prompt=${encodeURIComponent(connectionPrompt)}`}>
                <div className="flex cursor-pointer items-center justify-center gap-2 rounded-[1.35rem] border border-primary/15 bg-white/82 px-4 py-3 text-sm font-semibold text-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white">
                  <Send className="h-4 w-4 text-primary" />
                  Turn into a Note
                </div>
              </Link>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.24 }}
          className="app-card p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Favorite Moments</p>
              <h2 className="mt-2 text-2xl font-serif text-foreground">The ones you want to keep close</h2>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Heart className="h-5 w-5 fill-current" />
            </div>
          </div>

          {!allMomentsLoaded ? (
            <div className="mt-4 rounded-[1.35rem] border border-border/70 bg-muted/28 px-4 py-4">
              <p className="text-sm text-muted-foreground">Gathering your favorite moments...</p>
            </div>
          ) : favoriteMoments.length === 0 ? (
            <div className="mt-4 rounded-[1.35rem] border border-border/70 bg-muted/28 px-4 py-4">
              <p className="text-sm text-muted-foreground">
                Tap the little heart on a journal entry, affirmation, or note to keep your most treasured moments here.
              </p>
            </div>
          ) : (
            <div className="mt-4 grid gap-3">
              {favoriteMoments.map((moment) => (
                <Link key={moment.id} href={moment.href}>
                  <div className="group cursor-pointer rounded-[1.45rem] border border-border/70 bg-white/84 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                        <Heart className="h-3.5 w-3.5 fill-current" />
                        {moment.type}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatFriendlyTimestamp(moment.created_at)}</span>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-foreground">{moment.text}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">{moment.meta}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.section>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.26 }}
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">Our Spaces</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col gap-3"
        >
          {QUICK_LINKS.map(({ href, icon: Icon, label, description, color, activeBg }, i) => (
            <motion.div
              key={href}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
            >
              <Link href={href}>
                <div className={`app-card-soft flex items-center gap-4 p-5 ${activeBg} transition-all duration-200 group cursor-pointer hover:-translate-y-0.5 hover:shadow-lg`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-base leading-tight">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.66 }}
          className="app-card p-6"
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Words of Wisdom</p>
          <p className="font-serif text-foreground text-base leading-relaxed italic mb-3">
            "{QUOTES[quoteIndex].text}"
          </p>
          <p className="text-sm font-semibold text-primary">- {QUOTES[quoteIndex].author}</p>
          <div className="flex items-center justify-between mt-4">
            <button onClick={prevQuote} className="app-icon-button h-10 w-10 rounded-full border-transparent bg-muted/70 hover:bg-white">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-1.5">
              {QUOTES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setQuoteIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === quoteIndex ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/30"}`}
                />
              ))}
            </div>
            <button onClick={nextQuote} className="app-icon-button h-10 w-10 rounded-full border-transparent bg-muted/70 hover:bg-white">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
