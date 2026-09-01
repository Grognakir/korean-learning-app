"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { activeLanguageSchema, fontPreferencesSchema } from "./schemas";

export async function updateFontPreferences(formData: FormData) {
  const raw = {
    fontUi: formData.get("fontUi") || null,
    fontKr: formData.get("fontKr") || null,
  };
  const parsed = fontPreferencesSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Нужно войти" };

  const { error } = await supabase
    .from("profiles")
    .update({ font_ui: parsed.data.fontUi, font_kr: parsed.data.fontKr })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { success: true as const };
}

export async function updateActiveLanguage(formData: FormData) {
  const parsed = activeLanguageSchema.safeParse({
    language: formData.get("language"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Нужно войти" };

  const { error } = await supabase
    .from("profiles")
    .update({ active_language: parsed.data.language })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { success: true as const };
}
