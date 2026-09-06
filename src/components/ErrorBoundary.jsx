import { Component, } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

/**
 * Last line of defence. Without this, one thrown render error blanks the whole
 * kiosk screen and a patient mid-registration is simply stranded — which is
 * exactly the failure a public terminal cannot afford.
 */

export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // A real deployment would forward this to Sentry / the hospital's log sink.
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

   reset = () => this.setState({ error: null });

   goHome = () => {
    this.setState({ error: null });
    window.location.hash = "#/";
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="app-ambient flex min-h-screen items-center justify-center px-4 py-10">
        <div
          role="alert"
          className="w-full max-w-md rounded-[20px] border border-zinc-200 bg-white/95 p-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900/95 sm:p-8"
        >
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-[14px] bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
          </span>

          <h1 className="mt-5 font-display text-2xl font-semibold tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
            Something went wrong
          </h1>
          <p className="mt-2 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            This screen could not be displayed. Your details are saved — you can try again, or go back to the
            start. If it keeps happening, please tell the OPD desk.
          </p>

          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={this.reset}
              className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-emerald-600 px-5 py-3 text-base font-bold text-white transition-colors hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:bg-emerald-500 dark:text-zinc-950"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Try again
            </button>
            <button
              type="button"
              onClick={this.goHome}
              className="inline-flex items-center justify-center gap-2 rounded-[12px] border border-zinc-300 bg-white px-5 py-3 text-base font-semibold text-zinc-800 transition-colors hover:border-zinc-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <Home className="h-4 w-4" aria-hidden="true" />
              Start over
            </button>
          </div>

          {import.meta.env.DEV && (
            <pre className="mt-5 max-h-40 overflow-auto rounded-[10px] bg-zinc-100 p-3 text-left font-mono text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {this.state.error.message}
            </pre>
)}
        </div>
      </div>
);
  }
}
