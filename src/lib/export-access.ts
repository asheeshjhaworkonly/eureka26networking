import "server-only";
import { AppError, db } from "./db";

export function paymentGateEnabled() {
  return process.env.DOWNLOAD_PAYMENT_GATE_ENABLED === "true";
}

export async function exportAccess(uid: string) {
  const enabled = paymentGateEnabled();
  if (!enabled) return { paymentGateEnabled: false, unlocked: true };
  const { data, error } = await db()
    .from("purchases")
    .select("status")
    .eq("user_id", uid)
    .maybeSingle();
  if (error)
    throw new AppError(
      "Could not check download access. Please try again.",
      503,
    );
  return { paymentGateEnabled: true, unlocked: data?.status === "paid" };
}
