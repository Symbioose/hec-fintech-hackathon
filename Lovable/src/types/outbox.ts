export type OutboxStatus = "sent" | "acknowledged" | "received";

export interface OutboxRequest {
  id: string;
  product_id: string;
  product_name: string;
  issuer: string;
  message: string;
  status: OutboxStatus;
  sent_at: string;
  updated_at: string;
}
