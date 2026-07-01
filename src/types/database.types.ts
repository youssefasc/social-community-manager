/**
 * Strongly-typed representation of the Supabase Postgres schema for the
 * "social-community-manager" project (ref: wnxsfcclkjsgerjqmnrl).
 *
 * Kept in sync manually with supabase/migrations/*.sql. If you have the
 * Supabase CLI available, this can alternatively be regenerated with:
 *   supabase gen types typescript --project-id wnxsfcclkjsgerjqmnrl > src/types/database.types.ts
 */

export type AppRole = "owner" | "admin" | "editor" | "viewer";
export type AccountPlatform =
  | "facebook"
  | "linkedin"
  | "reddit"
  | "discord"
  | "telegram"
  | "other";
export type AccountStatus = "active" | "expired" | "error" | "disconnected";
export type CommunityPrivacy = "public" | "private" | "unknown";
export type MediaType = "image" | "video" | "other";
export type ContentStatus = "draft" | "ready" | "archived";
export type ScheduleStatus =
  | "queued"
  | "scheduled"
  | "publishing"
  | "published"
  | "failed"
  | "canceled";
export type ActivityLevel = "info" | "success" | "warning" | "error";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          role: AppRole;
          theme: "light" | "dark" | "system";
          notification_prefs: { email: boolean; in_app: boolean };
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      connected_accounts: {
        Row: {
          id: string;
          user_id: string;
          platform: AccountPlatform;
          display_name: string;
          profile_url: string | null;
          status: AccountStatus;
          storage_state_ref: string | null;
          last_verified_at: string | null;
          last_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["connected_accounts"]["Row"]> & {
          user_id: string;
          platform: AccountPlatform;
          display_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["connected_accounts"]["Row"]>;
      };
      communities: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          url: string;
          platform: AccountPlatform;
          privacy: CommunityPrivacy;
          member_count: number | null;
          description: string | null;
          tags: string[];
          is_saved: boolean;
          source: "finder" | "manual";
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["communities"]["Row"]> & {
          user_id: string;
          name: string;
          url: string;
        };
        Update: Partial<Database["public"]["Tables"]["communities"]["Row"]>;
      };
      media_items: {
        Row: {
          id: string;
          user_id: string;
          file_name: string;
          storage_path: string;
          media_type: MediaType;
          mime_type: string | null;
          size_bytes: number | null;
          category: string | null;
          width: number | null;
          height: number | null;
          duration_seconds: number | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["media_items"]["Row"]> & {
          user_id: string;
          file_name: string;
          storage_path: string;
          media_type: MediaType;
        };
        Update: Partial<Database["public"]["Tables"]["media_items"]["Row"]>;
      };
      content_items: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body_html: string;
          body_text: string;
          status: ContentStatus;
          is_template: boolean;
          template_name: string | null;
          media_ids: string[];
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["content_items"]["Row"]> & {
          user_id: string;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["content_items"]["Row"]>;
      };
      scheduled_posts: {
        Row: {
          id: string;
          user_id: string;
          content_id: string | null;
          community_id: string | null;
          account_id: string | null;
          scheduled_for: string;
          status: ScheduleStatus;
          attempt_count: number;
          last_attempt_at: string | null;
          published_at: string | null;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["scheduled_posts"]["Row"]> & {
          user_id: string;
          scheduled_for: string;
        };
        Update: Partial<Database["public"]["Tables"]["scheduled_posts"]["Row"]>;
      };
      activity_logs: {
        Row: {
          id: string;
          user_id: string;
          level: ActivityLevel;
          action: string;
          entity_type: string | null;
          entity_id: string | null;
          message: string;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["activity_logs"]["Row"]> & {
          user_id: string;
          action: string;
          message: string;
        };
        Update: Partial<Database["public"]["Tables"]["activity_logs"]["Row"]>;
      };
    };
  };
}
