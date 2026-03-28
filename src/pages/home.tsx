import { useMemo, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Sparkles, BookHeart, MessageCircleHeart, ChevronRight, ChevronLeft } from "lucide-react";
import { Layout } from "@/components/layout";
import { useAuth } from "@/context/auth-context";

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

function getDisplayName(email?: string | null) {
  if (!email) return "beautiful soul";

  const localPart = email.split("@")[0]?.trim();
  if (!localPart) return email;

  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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

export default function Home() {
  const { session } = useAuth();
  const affirmation = useMemo(getDailyAffirmation, []);
  const greeting = useMemo(getGreeting, []);
  const displayName = useMemo(() => getDisplayName(session?.user.email), [session?.user.email]);
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

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">Our Spaces</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
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
          transition={{ delay: 0.6 }}
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
