// -----------------------------------------------------------------------------
// STUB — placeholder Supabase types so the typed client compiles before the
// database is provisioned. Regenerate the real thing once the project is live:
//   Supabase MCP  -> generate_typescript_types
//   or CLI        -> supabase gen types typescript --project-id <ref>
// and overwrite this file.
// -----------------------------------------------------------------------------

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type GenericTable = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      [key: string]: GenericTable;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: "client" | "tailor" | "vendor" | "admin";
      order_type: "full" | "fabric_only" | "own_fabric";
      order_status:
        | "received"
        | "accepted"
        | "rejected"
        | "fabric_prepared"
        | "fabric_shipped"
        | "fabric_received_by_tailor"
        | "in_production"
        | "sewing"
        | "quality_check"
        | "shipped"
        | "delivered"
        | "cancelled";
      payment_status: "pending" | "paid" | "failed" | "refunded";
      payment_method: "orange_money" | "wave" | "free_money" | "card";
      measurement_mode: "manual" | "standard";
      delivery_method: "home" | "pickup";
    };
    CompositeTypes: Record<string, never>;
  };
}
