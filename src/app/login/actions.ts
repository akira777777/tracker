"use server";

import { clearAdminSession, setAdminSession, verifyAdminPassword } from "@/lib/auth";
import { emitSecureLog } from "@/lib/secure-logger";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");

  if (!verifyAdminPassword(password)) {
    emitSecureLog({
      severity: "warn",
      source: "login/actions",
      message: "Admin login rejected",
      activityType: "user",
    });

    redirect("/login?error=1");
  }

  await setAdminSession();
  emitSecureLog({
    severity: "info",
    source: "login/actions",
    message: "Admin login accepted",
    activityType: "user",
  });
  redirect("/admin");
}

export async function logoutAction() {
  await clearAdminSession();
  emitSecureLog({
    severity: "info",
    source: "login/actions",
    message: "Admin logged out",
    activityType: "user",
  });
  redirect("/login");
}
