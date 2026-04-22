export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type HourlyNoteStatus = "resolved" | "pending" | "needs_attention";
export type ProcessStage = "pending" | "in_progress" | "done";

export interface Database {
  public: {
    Tables: {
      hourly_notes: {
        Row: {
          id: string;
          note_date: string;
          hour: number;
          status: HourlyNoteStatus;
          content: string;
          author_name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          note_date: string;
          hour: number;
          status?: HourlyNoteStatus;
          content?: string;
          author_name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          note_date?: string;
          hour?: number;
          status?: HourlyNoteStatus;
          content?: string;
          author_name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      chat_messages: {
        Row: {
          id: string;
          body: string;
          author_name: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          body: string;
          author_name?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          body?: string;
          author_name?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      schedule_events: {
        Row: {
          id: string;
          event_date: string;
          start_time: string;
          end_time: string;
          title: string;
          notes: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_date: string;
          start_time: string;
          end_time: string;
          title: string;
          notes?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_date?: string;
          start_time?: string;
          end_time?: string;
          title?: string;
          notes?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      process_path_items: {
        Row: {
          id: string;
          title: string;
          stage: ProcessStage;
          detail: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          stage?: ProcessStage;
          detail?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          stage?: ProcessStage;
          detail?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
