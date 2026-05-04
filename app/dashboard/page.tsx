import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Redirect based on user role
  if (session.user.role === "admin") {
    redirect("/admin");
  } else if (session.user.role === "client" && session.user.clientSlug) {
    redirect(`/dashboard/gallery`);
  }

  // Fallback - shouldn't reach here
  redirect("/");
}
