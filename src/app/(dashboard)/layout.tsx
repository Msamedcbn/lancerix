import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutDashboard } from "lucide-react";

import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
] as const;

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-dvh">
      <header className="flex h-14 items-center gap-6 border-b px-6">
        <Link href="/dashboard" className="font-semibold tracking-tight">
          Mutabık
        </Link>
        <nav className="flex items-center gap-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Button key={href} asChild variant="ghost" size="sm">
              <Link href={href}>
                <Icon />
                {label}
              </Link>
            </Button>
          ))}
        </nav>
        <form action={signOut} className="ml-auto">
          <Button type="submit" variant="ghost" size="sm">
            Sign out
          </Button>
        </form>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
