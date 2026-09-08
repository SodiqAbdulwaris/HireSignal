import React from "react";
import Btn from "./Btn";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleClearAndReload = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8 text-foreground">
          <div className="w-full max-w-[540px] rounded-2xl border border-border bg-card p-10 text-center shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_10px_10px_-5px_rgba(0,0,0,0.4)]">
            <div className="mx-auto mb-6 inline-flex h-14 w-14 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-red-500">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>

            <h1 className="mb-2 text-[22px] font-semibold tracking-tight">Something went wrong</h1>
            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
              An unexpected error occurred in the application. Please try reloading the page. If the issue persists, clearing your local session might help.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <div className="mb-8 max-h-[150px] overflow-y-auto rounded-lg border border-border bg-black/25 p-4 text-left">
                <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Error Message
                </div>
                <code className="break-all font-mono text-xs text-red-400">
                  {this.state.error.toString()}
                </code>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Btn onClick={this.handleReload} variant="primary">Reload Page</Btn>
              <Btn onClick={this.handleClearAndReload} variant="secondary">Clear Session & Restart</Btn>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
