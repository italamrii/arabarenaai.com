"use client";

import { Component, type ReactNode } from "react";

interface AdminDashboardErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface AdminDashboardErrorBoundaryState {
  hasError: boolean;
}

export class AdminDashboardErrorBoundary extends Component<
  AdminDashboardErrorBoundaryProps,
  AdminDashboardErrorBoundaryState
> {
  state: AdminDashboardErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AdminDashboardErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <p className="text-sm text-muted-foreground">تعذر عرض هذا القسم.</p>
        )
      );
    }

    return this.props.children;
  }
}
