import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // Без проверки ошибки просроченная или уже использованная ссылка молча
  // приводила на главную без сессии — пользователь видел гостевую
  // страницу и не понимал, почему подтверждение «не сработало».
  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=confirm`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=confirm`);
  }

  return NextResponse.redirect(`${origin}/`);
}
