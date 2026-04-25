export type PurchaseAction =
  | "bought"
  | "rejected"
  | "requested_termsheet"
  | "watched"
  | "approved";

export interface PurchaseHistoryItem {
  id: string;
  asset_manager_id: string;
  product_id: string;
  action: PurchaseAction;
  amount?: number | null;
  date: string;
  reason?: string | null;
  feedback?: string | null;
}
