import { Bell, CheckCheck, HeartHandshake, MessageCircleHeart, Sparkles, Users } from "lucide-react";
import { Layout } from "@/components/layout";
import { ContentState } from "@/components/content-state";
import { useNotifications } from "@/hooks/use-notifications";
import { formatFriendlyTimestamp } from "@/lib/utils";

function getNotificationIcon(type: string) {
  switch (type) {
    case "connection_joined":
      return HeartHandshake;
    case "direct_message":
      return MessageCircleHeart;
    case "family_note":
      return Users;
    case "shared_note":
    case "mood_alert":
    default:
      return Sparkles;
  }
}

export default function NotificationsPage() {
  const { notifications, unreadCount, isLoaded, error, preferences, markAsRead, markAllAsRead, updatePreferences } =
    useNotifications();

  return (
    <Layout title="Notifications" subtitle="A soft inbox for connection updates and shared moments">
      <div className="mt-3 section-stack">
        <section className="app-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Notification Center</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Connection updates, shared notes, direct messages, family notes, and mood alerts all land here gently.
                </p>
              </div>
            </div>
            {unreadCount > 0 ? (
              <button type="button" onClick={() => void markAllAsRead()} className="app-button-secondary px-4 py-2">
                <CheckCheck className="mr-2 h-4 w-4" />
                Mark all read
              </button>
            ) : null}
          </div>
        </section>

        <section className="app-card-soft p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Notification settings</p>
          <div className="mt-4 grid gap-3">
            {[
              ["connection_updates", "Connection updates"],
              ["shared_notes", "Shared notes"],
              ["direct_messages", "Direct messages"],
              ["family_messages", "Family Space notes"],
              ["mood_alerts", "Mood alerts"],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center justify-between gap-3 rounded-[1.1rem] border border-border/70 bg-white/85 px-4 py-3">
                <span className="text-sm font-medium text-foreground">{label}</span>
                <button
                  type="button"
                  aria-pressed={Boolean(preferences?.[key as keyof typeof preferences])}
                  onClick={() =>
                    void updatePreferences({
                      [key]: !preferences?.[key as keyof typeof preferences],
                    })
                  }
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                    preferences?.[key as keyof typeof preferences] ? "bg-primary" : "bg-border"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                      preferences?.[key as keyof typeof preferences] ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </label>
            ))}
          </div>
        </section>

        <section>
          {!isLoaded ? (
            <ContentState message="Loading notifications..." loading />
          ) : error ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : notifications.length === 0 ? (
            <ContentState message="Nothing new right now. When something meaningful happens, it will show up here softly." />
          ) : (
            <div className="flex flex-col gap-3">
              {notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                return (
                  <a
                    key={notification.id}
                    href={notification.href ?? "#"}
                    onClick={() => void markAsRead(notification.id)}
                    className={`app-card-soft block p-4 transition-all duration-200 hover:-translate-y-0.5 ${
                      notification.read_at ? "opacity-80" : "border-primary/20 bg-primary/5"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-2xl bg-white/85 p-3 text-primary shadow-sm">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{notification.title}</p>
                          {!notification.read_at ? (
                            <span className="rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                              New
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{notification.body}</p>
                        <p className="mt-3 text-xs text-muted-foreground">{formatFriendlyTimestamp(notification.created_at)}</p>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
