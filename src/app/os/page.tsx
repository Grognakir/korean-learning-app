import type { Metadata } from "next";
import { requireUser } from "@/features/auth/requireUser";
import { SolomonOsClient } from "@/features/solomonOs/SolomonOsClient";

export const metadata: Metadata = { title: "Solomon OS" };

/** Полноэкранная игровая ОС: без шапки и нижней панели приложения. */
export default async function SolomonOsPage() {
  const { user } = await requireUser();
  return <SolomonOsClient key={user.id} userId={user.id} />;
}
