import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flower,
  Heart,
  Link2,
  Lock,
  MessageCircleHeart,
  Send,
  Share2,
  Trash2,
  Users,
  Home,
} from "lucide-react";
import { Layout } from "@/components/layout";
import { ContentState } from "@/components/content-state";
import { ShareMomentDialog } from "@/components/share-moment-dialog";
import { useAuth } from "@/context/auth-context";
import { useConnection } from "@/hooks/use-connection";
import { useDirectMessages } from "@/hooks/use-direct-messages";
import { useNotes, type Note, type NoteSpace } from "@/hooks/use-notes";
import { toast } from "@/hooks/use-toast";
import { SHARE_CARD_TAGLINE } from "@/lib/brand";
import type { ShareCardContent } from "@/lib/share-card";
import { formatFriendlyTimestamp, getUserLabel } from "@/lib/utils";

type NotesTab = "private" | "between_us" | "family" | "direct";

const TAB_CONFIG: Record<NotesTab, { label: string; description: string; icon: typeof Lock }> = {
  private: {
    label: "My Space",
    description: "Private notes only you can see",
    icon: Lock,
  },
  between_us: {
    label: "Between Us",
    description: "One-to-one space with one connection",
    icon: Users,
  },
  family: {
    label: "Family Space",
    description: "Shared intentionally with Mom and linked daughters",
    icon: Home,
  },
  direct: {
    label: "Direct Messages",
    description: "Soft one-to-one messages",
    icon: MessageCircleHeart,
  },
};

const PRIVATE_PROMPTS = [
  "A thought I want to keep to myself for now...",
  "Something I want to remember from today...",
  "A quiet feeling I want to hold onto...",
];

const BETWEEN_US_PROMPTS = [
  "Something I want us to hold together...",
  "A note meant just for one of us...",
  "A little truth for this relationship...",
];

const FAMILY_PROMPTS = [
  "Something I want the whole family space to hear...",
  "A family note I want us all to carry...",
  "A loving reminder for all of us...",
];

const DIRECT_PROMPTS = [
  "A soft message just for you...",
  "Something I want to tell you directly...",
  "A little note from my heart to yours...",
];

const OWN_BADGE = {
  Mom: "bg-primary/15 text-primary",
  Daughter: "bg-accent/20 text-accent-foreground",
} as const;

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center gap-3 py-14 text-center"
    >
      <Flower className="h-8 w-8 text-muted-foreground/40" />
      <p className="text-lg font-serif italic text-muted-foreground">{title}</p>
      <p className="max-w-sm text-sm leading-6 text-muted-foreground">{body}</p>
    </motion.div>
  );
}

function NotesList({
  notes,
  currentUserId,
  currentUserRole,
  activePartnerLabel,
  canUseFamilySpace,
  onShare,
  onToggleFavorite,
  onDelete,
  onMove,
}: {
  notes: Note[];
  currentUserId?: string;
  currentUserRole?: "Mom" | "Daughter" | null;
  activePartnerLabel: string | null;
  canUseFamilySpace: boolean;
  onShare: (item: ShareCardContent) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, space: NoteSpace) => void;
}) {
  if (notes.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence>
        {notes.map((note) => {
          const isOwn = note.user_id === currentUserId;
          const spaceLabel =
            note.visibility === "private"
              ? "Private to you"
              : note.visibility === "family"
                ? isOwn
                  ? "Shared with family"
                  : "Shared in family space"
                : isOwn
                  ? "Shared by you"
                  : "Shared with you";

          return (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.22 }}
              className="app-card-soft p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${OWN_BADGE[note.author]}`}>
                      {note.author}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatFriendlyTimestamp(note.created_at)}</span>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/70">{spaceLabel}</span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground">{note.text}</p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      onShare({
                        label:
                          note.visibility === "family"
                            ? "Family Space"
                            : note.visibility === "between_us"
                              ? "Between Us"
                              : "My Space",
                        text: note.text,
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

                  {isOwn ? (
                    <button
                      onClick={() => onToggleFavorite(note.id, !note.is_favorite)}
                      className={`rounded-xl p-2 transition-colors ${
                        note.is_favorite ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-primary/8 hover:text-primary"
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${note.is_favorite ? "fill-current" : ""}`} />
                    </button>
                  ) : null}

                  {isOwn && note.visibility === "private" && activePartnerLabel ? (
                    <button
                      onClick={() => onMove(note.id, "between_us")}
                      className="rounded-xl px-2.5 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-primary/8 hover:text-primary"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Link2 className="h-3.5 w-3.5" />
                        Share with {activePartnerLabel}
                      </span>
                    </button>
                  ) : null}

                  {isOwn && note.visibility === "private" && canUseFamilySpace ? (
                    <button
                      onClick={() => onMove(note.id, "family")}
                      className="rounded-xl px-2.5 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-primary/8 hover:text-primary"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        Share with family
                      </span>
                    </button>
                  ) : null}

                  {isOwn && note.visibility !== "private" ? (
                    <button
                      onClick={() => onMove(note.id, "private")}
                      className="rounded-xl px-2.5 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-primary/8 hover:text-primary"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5" />
                        Keep private
                      </span>
                    </button>
                  ) : null}

                  {isOwn ? (
                    <button
                      onClick={() => onDelete(note.id)}
                      className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export default function Notes() {
  const { session, profile } = useAuth();
  const { connection, connections, partnerRole, setSelectedPartnerId } = useConnection();
  const {
    privateNotes,
    betweenUsNotes,
    familyNotes,
    receivedBetweenUsNotes,
    isLoaded: notesLoaded,
    error: notesError,
    addNote,
    deleteNote,
    toggleFavorite,
    moveNoteToSpace,
  } = useNotes({
    activePartnerId: connection?.partner_id ?? null,
    familyOwnerId: profile?.role === "Mom" ? session?.user.id ?? null : connection?.partner_id ?? null,
    connectionsCount: connections.length,
  });
  const { messages, isLoaded: messagesLoaded, error: messagesError, sendMessage } = useDirectMessages({
    activePartnerId: connection?.partner_id ?? null,
  });

  const promptFromQuery = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("prompt")?.trim() ?? "";
  }, []);
  const tabFromQuery = useMemo(() => {
    if (typeof window === "undefined") return "private";
    const nextTab = new URLSearchParams(window.location.search).get("tab");
    return nextTab === "between_us" || nextTab === "family" || nextTab === "direct" ? nextTab : "private";
  }, []);
  const partnerFromQuery = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("partner")?.trim() ?? "";
  }, []);

  const [activeTab, setActiveTab] = useState<NotesTab>(tabFromQuery);
  const [draft, setDraft] = useState("");
  const [shareItem, setShareItem] = useState<ShareCardContent | null>(null);

  useEffect(() => {
    if (!promptFromQuery) return;
    setDraft((current) => (current.trim() ? current : activeTab === "direct" ? promptFromQuery : `${promptFromQuery}\n\n`));
  }, [activeTab, promptFromQuery]);

  useEffect(() => {
    if (!partnerFromQuery) return;
    const matchingConnection = connections.find((entry) => entry.partner_id === partnerFromQuery);
    if (matchingConnection) {
      setSelectedPartnerId(matchingConnection.partner_id);
    }
  }, [connections, partnerFromQuery, setSelectedPartnerId]);

  const activePartnerLabel = useMemo(
    () => getUserLabel(connection?.partner_name, connection?.partner_email ?? undefined),
    [connection?.partner_email, connection?.partner_name],
  );
  const canUseBetweenUs = Boolean(connection?.partner_id);
  const canUseFamilySpace = connections.length > 0;
  const directFeed = useMemo(
    () => [...messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [messages],
  );

  const currentPlaceholder =
    activeTab === "private"
      ? PRIVATE_PROMPTS[0]
      : activeTab === "between_us"
        ? BETWEEN_US_PROMPTS[0]
        : activeTab === "family"
          ? FAMILY_PROMPTS[0]
          : DIRECT_PROMPTS[0];

  const handleCreate = async () => {
    if (!draft.trim()) return;

    if (activeTab === "direct") {
      const success = await sendMessage(draft.trim());
      if (!success) {
        toast({
          title: "Couldn't send message",
          description: "Please try again in a moment.",
        });
        return;
      }

      setDraft("");
      toast({
        title: "Message sent",
        description: `Your message was sent privately${activePartnerLabel ? ` to ${activePartnerLabel}` : ""}.`,
      });
      return;
    }

    const success = await addNote(draft.trim(), activeTab);
    if (!success) {
      toast({
        title: "Couldn't save note",
        description: "Please try again in a moment.",
      });
      return;
    }

    setDraft("");
    toast({
      title:
        activeTab === "private"
          ? "Saved to My Space"
          : activeTab === "between_us"
            ? "Saved to Between Us"
            : "Saved to Family Space",
      description:
        activeTab === "private"
          ? "Only you can see this note."
          : activeTab === "between_us"
            ? `Only you and ${activePartnerLabel ?? partnerRole ?? "your connection"} can see this note.`
            : "This note is now visible inside Family Space only.",
    });
  };

  const notesErrorMessage = notesError ?? messagesError;

  return (
    <Layout title="Notes" subtitle="Private, one-to-one, and family spaces that stay intentional">
      <div className="mt-3 section-stack">
        <ShareMomentDialog item={shareItem} onClose={() => setShareItem(null)} />

        {notesErrorMessage ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {notesErrorMessage}
          </div>
        ) : null}

        <section className="app-card overflow-hidden">
          <div className="border-b border-border/80 px-4 py-4">
            <div className="grid grid-cols-2 gap-2 rounded-[1.3rem] bg-muted/45 p-1 md:grid-cols-4">
              {(Object.keys(TAB_CONFIG) as NotesTab[]).map((tab) => {
                const tabMeta = TAB_CONFIG[tab];
                const Icon = tabMeta.icon;
                const active = tab === activeTab;

                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-[1.1rem] px-3 py-3 text-left transition-all duration-200 ${
                      active ? "bg-white shadow-sm" : "text-muted-foreground hover:bg-white/65"
                    }`}
                  >
                    <div className={`inline-flex items-center gap-2 text-sm font-semibold ${active ? "text-foreground" : ""}`}>
                      <Icon className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
                      {tabMeta.label}
                    </div>
                    <p className="mt-1 text-[11px] leading-5 text-muted-foreground">{tabMeta.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-5">
            {(activeTab === "between_us" || activeTab === "direct") && connections.length > 1 ? (
              <div className="mb-4 rounded-[1.2rem] border border-border/80 bg-muted/25 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Choose your daughter space</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {connections.map((entry) => {
                    const label = getUserLabel(entry.partner_name, entry.partner_email ?? undefined);
                    const active = entry.partner_id === connection?.partner_id;

                    return (
                      <button
                        key={entry.partner_id}
                        type="button"
                        onClick={() => setSelectedPartnerId(entry.partner_id)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                          active ? "bg-primary text-white shadow-sm" : "bg-white text-foreground shadow-sm hover:-translate-y-0.5"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="rounded-[1.2rem] border border-primary/10 bg-primary/6 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/75">
                {activeTab === "private"
                  ? "My Space"
                  : activeTab === "between_us"
                    ? "Between Us"
                    : activeTab === "family"
                      ? "Family Space"
                      : "Direct Messages"}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {activeTab === "private" &&
                  "These notes stay private to you. Nothing here becomes visible to anyone else unless you choose a different space."}
                {activeTab === "between_us" &&
                  `This space is only for you and ${activePartnerLabel ?? partnerRole ?? "your connection"}. One daughter never sees another daughter's Between Us notes.`}
                {activeTab === "family" &&
                  "Family Space is shared intentionally with Mom and all connected daughters. It stays separate from one-to-one spaces."}
                {activeTab === "direct" &&
                  `Messages here are private between sender and recipient only. They stay just between you and ${activePartnerLabel ?? partnerRole ?? "your connection"}.`}
              </p>
              <p className="mt-2 text-xs font-medium text-foreground">Writing as {profile?.role ?? "your profile"}</p>
            </div>

            {promptFromQuery && activeTab !== "direct" ? (
              <div className="mt-4 rounded-[1.2rem] border border-primary/15 bg-primary/8 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80">Connection prompt</p>
                <p className="mt-2 text-sm leading-6 text-foreground">{promptFromQuery}</p>
              </div>
            ) : null}

            <div className="mt-4">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={currentPlaceholder}
                disabled={(activeTab === "between_us" || activeTab === "direct") && !canUseBetweenUs}
                className="min-h-[110px] w-full resize-none rounded-2xl bg-muted/30 p-4 text-base text-foreground placeholder:text-muted-foreground transition-shadow focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  {activeTab === "private" && "Visible only to you"}
                  {activeTab === "between_us" &&
                    (canUseBetweenUs
                      ? `Visible only to you and ${activePartnerLabel ?? partnerRole}`
                      : "Choose or create a connection first")}
                  {activeTab === "family" &&
                    (canUseFamilySpace ? "Visible in Family Space only" : "Connect family members first")}
                  {activeTab === "direct" &&
                    (canUseBetweenUs
                      ? `Sent privately to ${activePartnerLabel ?? partnerRole}`
                      : "Choose or create a connection first")}
                </p>
                <button
                  type="button"
                  onClick={() => void handleCreate()}
                  disabled={
                    !draft.trim() ||
                    ((activeTab === "between_us" || activeTab === "direct") && !canUseBetweenUs) ||
                    (activeTab === "family" && !canUseFamilySpace)
                  }
                  className="app-button-primary flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                  {activeTab === "direct"
                    ? "Send message"
                    : activeTab === "between_us"
                      ? "Share one-to-one"
                      : activeTab === "family"
                        ? "Share with family"
                        : "Save note"}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section>
          {activeTab === "private" && (
            <>
              {!notesLoaded ? (
                <ContentState message="Loading My Space..." loading />
              ) : privateNotes.length === 0 ? (
                <EmptyState
                  title="Your private space is still quiet."
                  body="Keep a thought here when you want somewhere gentle to land before sharing anything at all."
                />
              ) : (
                <NotesList
                  notes={privateNotes}
                  currentUserId={session?.user.id}
                  currentUserRole={profile?.role ?? null}
                  activePartnerLabel={activePartnerLabel}
                  canUseFamilySpace={canUseFamilySpace}
                  onShare={setShareItem}
                  onToggleFavorite={(id, isFavorite) => void toggleFavorite(id, isFavorite)}
                  onDelete={(id) => void deleteNote(id)}
                  onMove={(id, space) => void moveNoteToSpace(id, space)}
                />
              )}
            </>
          )}

          {activeTab === "between_us" && (
            <>
              {!notesLoaded ? (
                <ContentState message="Loading Between Us..." loading />
              ) : betweenUsNotes.length === 0 ? (
                <EmptyState
                  title={canUseBetweenUs ? "Between Us is still waiting for its first note." : "Choose a connection when you're ready."}
                  body={
                    canUseBetweenUs
                      ? `When one of you intentionally shares something with ${activePartnerLabel ?? partnerRole}, it will appear here and stay just between the two of you.`
                      : "Once you choose a connection, this one-to-one space will open gently here."
                  }
                />
              ) : (
                <NotesList
                  notes={betweenUsNotes}
                  currentUserId={session?.user.id}
                  currentUserRole={profile?.role ?? null}
                  activePartnerLabel={activePartnerLabel}
                  canUseFamilySpace={canUseFamilySpace}
                  onShare={setShareItem}
                  onToggleFavorite={(id, isFavorite) => void toggleFavorite(id, isFavorite)}
                  onDelete={(id) => void deleteNote(id)}
                  onMove={(id, space) => void moveNoteToSpace(id, space)}
                />
              )}
            </>
          )}

          {activeTab === "family" && (
            <>
              {!notesLoaded ? (
                <ContentState message="Loading Family Space..." loading />
              ) : familyNotes.length === 0 ? (
                <EmptyState
                  title={canUseFamilySpace ? "Family Space is ready whenever you are." : "Family Space opens after connection is set up."}
                  body={
                    canUseFamilySpace
                      ? "When someone intentionally shares a family-wide note, it will appear here for everyone included in that family space."
                      : "Once connection is in place, Family Space will be ready for shared notes meant for everyone."
                  }
                />
              ) : (
                <NotesList
                  notes={familyNotes}
                  currentUserId={session?.user.id}
                  currentUserRole={profile?.role ?? null}
                  activePartnerLabel={activePartnerLabel}
                  canUseFamilySpace={canUseFamilySpace}
                  onShare={setShareItem}
                  onToggleFavorite={(id, isFavorite) => void toggleFavorite(id, isFavorite)}
                  onDelete={(id) => void deleteNote(id)}
                  onMove={(id, space) => void moveNoteToSpace(id, space)}
                />
              )}
            </>
          )}

          {activeTab === "direct" && (
            <>
              {!messagesLoaded ? (
                <ContentState message="Loading direct messages..." loading />
              ) : directFeed.length === 0 ? (
                <EmptyState
                  title={canUseBetweenUs ? "No direct messages yet, just open space." : "Choose a connection when you're ready."}
                  body={
                    canUseBetweenUs
                      ? `Send one gentle message and it will stay private between you and ${activePartnerLabel ?? partnerRole}.`
                      : "Direct messages open once you choose the connection you want to write to."
                  }
                />
              ) : (
                <div className="flex flex-col gap-3">
                  {directFeed.map((message) => {
                    const isOwn = message.sender_id === session?.user.id;
                    return (
                      <div key={message.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[82%] rounded-2xl border px-4 py-3 shadow-sm ${
                            isOwn
                              ? "rounded-tr-sm border-primary/15 bg-primary/10"
                              : "rounded-tl-sm border-border bg-white"
                          }`}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${OWN_BADGE[message.sender_role]}`}>
                              {message.sender_role}
                            </span>
                            <span className="text-xs text-muted-foreground">{formatFriendlyTimestamp(message.created_at)}</span>
                          </div>
                          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground">{message.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>

        {activeTab === "between_us" && canUseBetweenUs && receivedBetweenUsNotes.length > 0 ? (
          <p className="text-center text-xs text-muted-foreground">
            Notes from {activePartnerLabel ?? partnerRole} appear here only because one of you intentionally shared them into this one-to-one space.
          </p>
        ) : null}
      </div>
    </Layout>
  );
}
