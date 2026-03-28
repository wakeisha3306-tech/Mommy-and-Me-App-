import { clsx, type ClassValue } from "clsx"
import { format, isToday, isYesterday } from "date-fns"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFriendlyTimestamp(value: string) {
  const date = new Date(value)

  if (isToday(date)) {
    return `Today at ${format(date, "h:mm a")}`
  }

  if (isYesterday(date)) {
    return `Yesterday at ${format(date, "h:mm a")}`
  }

  return format(date, "MMM d, yyyy 'at' h:mm a")
}
