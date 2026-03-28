import { useMemo, useState } from "react";
import { Download, Share2, X } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { toast } from "@/hooks/use-toast";
import { downloadShareCard, shareShareCard, type ShareCardContent } from "@/lib/share-card";

interface ShareMomentDialogProps {
  item: ShareCardContent | null;
  onClose: () => void;
}

export function ShareMomentDialog({ item, onClose }: ShareMomentDialogProps) {
  const { profile } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const personalizedItem = useMemo<ShareCardContent | null>(() => {
    if (!item) return null;

    const closingOptions = [
      "Thinking of you",
      "This made me smile",
      "A little moment for you",
      "Holding this with love",
    ];

    return {
      ...item,
      closingLine: closingOptions[Math.floor(Math.random() * closingOptions.length)],
      senderLine: profile?.role ? `From ${profile.role} 💛` : undefined,
    };
  }, [item, profile?.role]);

  if (!personalizedItem) return null;

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      await downloadShareCard(personalizedItem);
      toast({
        title: "Share card downloaded",
        description: "Your moment is ready to share whenever you are.",
      });
    } catch (error) {
      toast({
        title: "Couldn't download share card",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleNativeShare = async () => {
    try {
      setIsSharing(true);
      const shared = await shareShareCard(personalizedItem);

      if (!shared) {
        toast({
          title: "Native share is not available here",
          description: "You can still download the image and share it manually.",
        });
        return;
      }

      toast({
        title: "Ready to share",
        description: "Only the moment you selected is included.",
      });
    } catch (error) {
      toast({
        title: "Couldn't open share options",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 px-4 py-6 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-white/70 bg-white/96 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Share a Moment</p>
            <h2 className="mt-1 text-2xl font-serif text-foreground">A gentle little card</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-white text-muted-foreground transition hover:border-primary/20 hover:text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-5">
          <div className="overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-[#fff6ef] via-[#f8e5ea] to-[#ede7f7] p-5 shadow-lg">
            <div className="rounded-[1.5rem] border border-white/80 bg-white/75 px-5 py-6 shadow-sm backdrop-blur-sm">
              <p className="text-center text-[11px] font-semibold uppercase tracking-[0.25em] text-primary/80">Mommy & Me</p>
              <p className="mt-3 text-center text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {personalizedItem.label}
              </p>
              <p className="mt-5 text-center text-2xl font-serif leading-snug text-foreground">
                "{personalizedItem.text}"
              </p>
              <p className="mt-5 text-center text-sm text-muted-foreground">
                {personalizedItem.tagline ?? "A moment that mattered"}
              </p>
              <p className="mt-4 text-center text-xs text-primary/70">{personalizedItem.closingLine}</p>
              {personalizedItem.senderLine ? (
                <p className="mt-1 text-center text-[11px] text-primary/60">{personalizedItem.senderLine}</p>
              ) : null}
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            This only shares the moment you selected. Nothing else from your account is included.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => void handleDownload()}
              disabled={isDownloading || isSharing}
              className="app-button app-button-primary flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Download className="h-4 w-4" />
              {isDownloading ? "Preparing..." : "Download image"}
            </button>
            <button
              type="button"
              onClick={() => void handleNativeShare()}
              disabled={isDownloading || isSharing}
              className="app-button rounded-2xl border border-primary/15 bg-primary/8 text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/12 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className="inline-flex items-center gap-2">
                <Share2 className="h-4 w-4 text-primary" />
                {isSharing ? "Opening..." : "Share now"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
