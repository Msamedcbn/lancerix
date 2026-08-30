import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-muted-foreground text-sm">
          Signed in as {user?.email}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>No contracts yet</CardTitle>
          <CardDescription>
            Contracts, escrow balances and invoices will appear here once the
            schema and payment flows are wired up.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
