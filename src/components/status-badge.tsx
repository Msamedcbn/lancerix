import { Badge } from "@/components/ui/badge";
import type { Enums } from "@/lib/supabase/database.types";

type EscrowStatus = Enums<"escrow_status">;

/**
 * The status vocabulary is the state machine's, shown in the words a user would
 * use. The variant carries the meaning that matters at a glance: whether money
 * is at rest, moving, or stuck.
 */
const LABEL: Record<EscrowStatus, string> = {
  DRAFT: "Draft",
  AWAITING_PAYMENT: "Awaiting funding",
  IN_PROGRESS: "In progress",
  SUBMITTED: "Delivered",
  COMPLETED: "Approved",
  RELEASED: "Paid out",
  DISPUTED: "Disputed",
  CANCELLED: "Cancelled",
};

const VARIANT: Record<EscrowStatus, "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT: "outline",
  AWAITING_PAYMENT: "outline",
  IN_PROGRESS: "secondary",
  SUBMITTED: "secondary",
  COMPLETED: "default",
  RELEASED: "default",
  DISPUTED: "destructive",
  CANCELLED: "destructive",
};

export function StatusBadge({ status }: Readonly<{ status: EscrowStatus }>) {
  return <Badge variant={VARIANT[status]}>{LABEL[status]}</Badge>;
}

export { LABEL as STATUS_LABEL };
