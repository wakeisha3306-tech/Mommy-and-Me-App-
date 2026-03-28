export function LoadingScreen({ message = "Loading your space..." }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-5 h-14 w-14 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="font-serif text-2xl text-foreground">Mommy & Me</p>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
