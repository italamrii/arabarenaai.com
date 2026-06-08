"use client";

import { Component, type ReactNode } from "react";

import { AdminSectionErrorFallback } from "@/components/admin/admin-section-error-fallback";

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
        this.props.fallback ?? <AdminSectionErrorFallback />
      );
    }

    return this.props.children;
  }
}
