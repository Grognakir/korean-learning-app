import { requireUser } from "@/features/auth/requireUser";
import { RouteLabClient } from "@/features/solomonOs/map/RouteLabClient";

export const metadata = { title: "Карта и заметки — Solomon OS" };

export default async function RouteLabPage() {
  const { user } = await requireUser();
  return <RouteLabClient userId={user.id} />;
}
