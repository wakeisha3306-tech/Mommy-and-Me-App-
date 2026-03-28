import { Flower2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

interface ContentStateProps {
  message: string;
  loading?: boolean;
}

export function ContentState({ message, loading = false }: ContentStateProps) {
  return (
    <div className="app-card px-6 py-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
        {loading ? <Spinner className="size-5" /> : <Flower2 className="h-5 w-5" />}
      </div>
      <p className="mt-4 font-serif text-lg text-foreground">
        {loading ? "Loading..." : message}
      </p>
      {loading && <p className="mt-2 text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
