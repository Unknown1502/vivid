import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="container flex min-h-screen flex-col">
      <header className="flex items-center justify-between py-6">
        <Wordmark />
      </header>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="kicker mb-3">404 · no explainer here</div>
        <h1 className="font-display text-4xl tracking-tight sm:text-5xl">
          This link didn&rsquo;t lead anywhere vivid.
        </h1>
        <p className="mt-3 max-w-md text-muted-foreground">
          The explainer may have expired, or the link is mistyped. Good news:
          making a fresh one takes a sentence.
        </p>
        <Button asChild size="lg" className="mt-8">
          <Link href="/">Make your own</Link>
        </Button>
      </div>
    </main>
  );
}
