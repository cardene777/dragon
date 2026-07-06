import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind class merge utility (shadcn/ui convention)。
 * clsx で conditional class を組立、 tailwind-merge で衝突 class を dedup。
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
