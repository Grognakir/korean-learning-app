const MESSAGES: Record<string, string> = {
  invalid_credentials: "Неверный email или пароль.",
  email_not_confirmed: "Email не подтверждён. Перейдите по ссылке из письма.",
  user_already_exists: "Аккаунт с таким email уже есть. Войдите или используйте другой email.",
  email_exists: "Аккаунт с таким email уже есть. Войдите или используйте другой email.",
  weak_password: "Пароль слишком простой. Придумайте более надёжный.",
  over_email_send_rate_limit: "Слишком много писем. Подождите немного и повторите.",
  over_request_rate_limit: "Слишком много попыток. Подождите немного и повторите.",
  signup_disabled: "Регистрация сейчас закрыта.",
};

export const AUTH_FALLBACK_ERROR = "Не удалось выполнить действие. Попробуйте ещё раз.";

/** Русский текст ошибки Supabase Auth по её коду; английский текст сервера пользователю не показываем. */
export function authErrorMessage(error: { code?: string | null }): string {
  return (error.code && MESSAGES[error.code]) || AUTH_FALLBACK_ERROR;
}
