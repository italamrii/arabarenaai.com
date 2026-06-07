import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { Container } from "@/components/layout/container";
import {
  ADMIN_SESSION_COOKIE,
  isAdminConfigured,
  verifyAdminSessionToken,
} from "@/lib/admin/session";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (await verifyAdminSessionToken(token)) {
    redirect("/admin/dashboard");
  }

  return (
    <Container className="py-12">
      <AdminLoginForm configured={isAdminConfigured()} />
    </Container>
  );
}
