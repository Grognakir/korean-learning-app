"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { registerSchema, loginSchema } from "./schemas";

export async function signUp(formData: FormData) {
  const parsed = registerSchema.safeParse({
    username: formData.get("display_name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const headersList = await headers();
  const origin =
    headersList.get("origin") ?? `http://${headersList.get("host")}`;

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { username: parsed.data.username },
      emailRedirectTo: `${origin}/confirm`,
    },
  });
  if (error) return { error: error.message };

  return { success: true as const };
}

export async function signIn(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message };

  redirect("/");
}

export async function devSignIn() {
  if (process.env.NODE_ENV === "production") {
    console.error("devSignIn: недоступно вне dev-окружения");
    return;
  }

  const email = process.env.DEV_LOGIN_EMAIL;
  const password = process.env.DEV_LOGIN_PASSWORD;
  if (!email || !password) {
    console.error(
      "devSignIn: DEV_LOGIN_EMAIL/DEV_LOGIN_PASSWORD не заданы в .env.local",
    );
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    console.error("devSignIn:", error.message);
    return;
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
