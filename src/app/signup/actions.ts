"use server";

import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { signUpUseCase } from "@/application/use-cases/auth/auth-use-cases";
import { signupSchema } from "@/lib/validators/auth";

export async function signupAction(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  const parsed = signupSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createSupabaseServerClient();
  const result = await signUpUseCase(
    supabase,
    parsed.data.fullName,
    parsed.data.email,
    parsed.data.password
  );
  if (!result.success) {
    return { error: result.error ?? "Unable to create account" };
  }

  return { success: true };
}
