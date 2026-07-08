import { ExternalLink, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

const REPO_URL = "https://github.com/Mill1995/eudi-token-inspector";

export function App(): React.JSX.Element {
  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="text-muted-foreground flex items-center gap-2">
        <ShieldCheck className="size-5" aria-hidden />
        <span className="text-sm font-medium tracking-wide uppercase">EUDI Inspector</span>
      </div>

      <h1 className="text-3xl font-semibold text-balance sm:text-4xl">
        Inspect EUDI Wallet presentation artifacts, entirely in your browser
      </h1>

      <p className="text-muted-foreground text-balance">
        Paste an SD-JWT VC or an OpenID4VP request to decode disclosures, verify signatures locally,
        check issuer trust, and flag overasking. Nothing ever leaves your browser.
      </p>

      <p className="text-muted-foreground text-sm">Under construction — scaffold only.</p>

      <Button asChild variant="outline">
        <a href={REPO_URL} target="_blank" rel="noreferrer noopener">
          <ExternalLink aria-hidden />
          View on GitHub
        </a>
      </Button>
    </main>
  );
}
