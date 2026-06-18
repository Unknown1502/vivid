import Link from "next/link";
import { cn } from "@/lib/utils";

export function Wordmark({
  className,
  href = "/",
}: {
  className?: string;
  href?: string | null;
}) {
  const inner = (
    <span
      className={cn(
        "font-display text-2xl font-semibold tracking-tight text-vivid",
        className,
      )}
    >
      Vivid
    </span>
  );
  if (href === null) return inner;
  return (
    <Link href={href} className="inline-flex items-center">
      {inner}
    </Link>
  );
}
