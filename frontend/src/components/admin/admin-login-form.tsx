"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ar } from "@/i18n/ar";

interface AdminLoginFormProps {
  configured: boolean;
}

export function AdminLoginForm({ configured }: AdminLoginFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!configured) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>{ar.admin.loginTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{ar.admin.notConfigured}</p>
        </CardContent>
      </Card>
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.status === 503) {
        setError(ar.admin.notConfigured);
        return;
      }

      if (!response.ok) {
        setError(ar.admin.invalidCredentials);
        return;
      }

      router.push("/admin/dashboard");
      router.refresh();
    } catch {
      setError(ar.admin.invalidCredentials);
    } finally {
      setLoading(false);
      setPassword("");
    }
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{ar.admin.loginTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-password">{ar.admin.passwordLabel}</Label>
            <Input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={loading}
              required
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={loading} className="w-full">
            {ar.admin.login}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
