"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslations } from "@/i18n/locale-context";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

function ErrorBoundaryFallback({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations();

  return (
    <Card className="border-destructive/30">
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-muted-foreground">{t.errors.generic}</p>
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" />
          {t.errors.retry}
        </Button>
      </CardContent>
    </Card>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary:", error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <ErrorBoundaryFallback onRetry={() => this.setState({ hasError: false })} />
      );
    }
    return this.props.children;
  }
}
