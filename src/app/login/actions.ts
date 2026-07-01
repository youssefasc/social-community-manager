"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { signInUseCase, signOutUseCase } from "@/application/use-cases/auth/auth-use-cases";
import { loginSchema } from "@/lib/validators/auth";

export async function loginAction(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createSupabaseServerClient();
  const result = await signInUseCase(supabase, parsed.data.email, parsed.data.password);
  if (!result.success) {
    return { error: result.error ?? "Unable to sign in" };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await signOutUseCase(supabase);
  redirect("/login");
}
