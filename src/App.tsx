import { ExternalLink, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Inspector } from "@/inspector/Inspector";

const REPO_URL = "https://github.com/Mill1995/eudi-token-inspector";

function Header(): React.JSX.Element {
  return (
    <header className="bg-background/80 sticky top-0 z-10 border-b backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-brand size-5" aria-hidden />
          <span className="font-semibold tracking-tight">EUDI Inspector</span>
          <span className="border-brand/20 bg-brand/10 text-brand ml-1 hidden rounded-full border px-2 py-0.5 text-xs font-medium sm:inline">
            runs entirely in your browser
          </span>
        </div>
        <Button asChild variant="outline" size="sm">
          <a href={REPO_URL} target="_blank" rel="noreferrer noopener">
            <ExternalLink aria-hidden />
            GitHub
          </a>
        </Button>
      </div>
    </header>
  );
}

export function App(): React.JSX.Element {
  return (
    <div className="min-h-svh">
      <Header />
      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            Inspect EUDI Wallet presentation artifacts
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm text-balance">
            Paste an SD-JWT VC or an OpenID4VP request to decode its disclosures and verify it
            locally — issuer and holder signatures, the disclosure seal, validity, and binding.
            Nothing leaves your browser.
          </p>
        </div>
        <Inspector />
      </main>
    </div>
  );
}
