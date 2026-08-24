export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      analytics_events: {
        Row: {
          event_name: string;
          id: string;
          occurred_at: string;
          properties: Json;
          user_id: string;
        };
        Insert: {
          event_name: string;
          id?: string;
          occurred_at?: string;
          properties?: Json;
          user_id?: string;
        };
        Update: {
          event_name?: string;
          id?: string;
          occurred_at?: string;
          properties?: Json;
          user_id?: string;
        };
        Relationships: [];
      };
      appointments: {
        Row: {
          id: string;
          reminder_duration_id: string | null;
          starts_at: string;
          title: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          reminder_duration_id?: string | null;
          starts_at: string;
          title: string;
          user_id: string;
        };
        Update: {
          id?: string;
          reminder_duration_id?: string | null;
          starts_at?: string;
          title?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "appointments_reminder_duration_id_fkey";
            columns: ["reminder_duration_id"];
            isOneToOne: false;
            referencedRelation: "reminder_durations";
            referencedColumns: ["id"];
          },
        ];
      };
      areas: {
        Row: {
          id: string;
          is_active: boolean;
          name: string;
          sort_order: number | null;
          state_code: string;
        };
        Insert: {
          id?: string;
          is_active?: boolean;
          name: string;
          sort_order?: number | null;
          state_code: string;
        };
        Update: {
          id?: string;
          is_active?: boolean;
          name?: string;
          sort_order?: number | null;
          state_code?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          icon_key: string | null;
          id: string;
          is_active: boolean;
          long_description: string | null;
          name: string;
          short_description: string | null;
        };
        Insert: {
          icon_key?: string | null;
          id?: string;
          is_active?: boolean;
          long_description?: string | null;
          name: string;
          short_description?: string | null;
        };
        Update: {
          icon_key?: string | null;
          id?: string;
          is_active?: boolean;
          long_description?: string | null;
          name?: string;
          short_description?: string | null;
        };
        Relationships: [];
      };
      category_placements: {
        Row: {
          category_id: string;
          sort_order: number | null;
          surface: string;
        };
        Insert: {
          category_id: string;
          sort_order?: number | null;
          surface: string;
        };
        Update: {
          category_id?: string;
          sort_order?: number | null;
          surface?: string;
        };
        Relationships: [
          {
            foreignKeyName: "category_placements_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      category_resources: {
        Row: {
          category_id: string;
          resource_id: string;
          sort_order: number | null;
        };
        Insert: {
          category_id: string;
          resource_id: string;
          sort_order?: number | null;
        };
        Update: {
          category_id?: string;
          resource_id?: string;
          sort_order?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "category_resources_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "category_resources_resource_id_fkey";
            columns: ["resource_id"];
            isOneToOne: false;
            referencedRelation: "resources";
            referencedColumns: ["id"];
          },
        ];
      };
      directories: {
        Row: {
          area_id: string | null;
          description: string | null;
          external_url: string;
          id: string;
          is_active: boolean;
          is_juvenile_justice_centered: boolean | null;
          name: string;
          state_code: string;
        };
        Insert: {
          area_id?: string | null;
          description?: string | null;
          external_url: string;
          id?: string;
          is_active?: boolean;
          is_juvenile_justice_centered?: boolean | null;
          name: string;
          state_code: string;
        };
        Update: {
          area_id?: string | null;
          description?: string | null;
          external_url?: string;
          id?: string;
          is_active?: boolean;
          is_juvenile_justice_centered?: boolean | null;
          name?: string;
          state_code?: string;
        };
        Relationships: [];
      };
      community_durations: {
        Row: {
          id: string;
          is_active: boolean;
          label: string;
          sort_order: number | null;
        };
        Insert: {
          id?: string;
          is_active?: boolean;
          label: string;
          sort_order?: number | null;
        };
        Update: {
          id?: string;
          is_active?: boolean;
          label?: string;
          sort_order?: number | null;
        };
        Relationships: [];
      };
      goal_categories: {
        Row: {
          description: string | null;
          icon_key: string | null;
          id: string;
          subtitle: string | null;
          title: string;
        };
        Insert: {
          description?: string | null;
          icon_key?: string | null;
          id?: string;
          subtitle?: string | null;
          title: string;
        };
        Update: {
          description?: string | null;
          icon_key?: string | null;
          id?: string;
          subtitle?: string | null;
          title?: string;
        };
        Relationships: [];
      };
      path_progress_labels: {
        Row: {
          label: string;
          status: "done" | "in_progress" | "not_started";
        };
        Insert: {
          label: string;
          status: "done" | "in_progress" | "not_started";
        };
        Update: {
          label?: string;
          status?: "done" | "in_progress" | "not_started";
        };
        Relationships: [];
      };
      path_task_resources: {
        Row: {
          path_task_id: string;
          resource_id: string;
          sort_order: number | null;
        };
        Insert: {
          path_task_id: string;
          resource_id: string;
          sort_order?: number | null;
        };
        Update: {
          path_task_id?: string;
          resource_id?: string;
          sort_order?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "path_task_resources_path_task_id_fkey";
            columns: ["path_task_id"];
            isOneToOne: false;
            referencedRelation: "path_tasks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "path_task_resources_resource_id_fkey";
            columns: ["resource_id"];
            isOneToOne: false;
            referencedRelation: "resources";
            referencedColumns: ["id"];
          },
        ];
      };
      path_tasks: {
        Row: {
          completed_label: string | null;
          created_at: string;
          description: string | null;
          goal_category_id: string;
          id: string;
          incomplete_label: string | null;
          is_active: boolean;
          sort_order: number | null;
          subtitle: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          completed_label?: string | null;
          created_at?: string;
          description?: string | null;
          goal_category_id: string;
          id?: string;
          incomplete_label?: string | null;
          is_active?: boolean;
          sort_order?: number | null;
          subtitle?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          completed_label?: string | null;
          created_at?: string;
          description?: string | null;
          goal_category_id?: string;
          id?: string;
          incomplete_label?: string | null;
          is_active?: boolean;
          sort_order?: number | null;
          subtitle?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "path_tasks_goal_category_id_fkey";
            columns: ["goal_category_id"];
            isOneToOne: false;
            referencedRelation: "goal_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          area_id: string | null;
          birth_month: number | null;
          birth_year: number | null;
          community_duration_id: string | null;
          id: string;
          onboarding_completed_at: string | null;
          onboarding_step: number | null;
          state_code: string | null;
          timezone: string | null;
        };
        Insert: {
          area_id?: string | null;
          birth_month?: number | null;
          birth_year?: number | null;
          community_duration_id?: string | null;
          id: string;
          onboarding_completed_at?: string | null;
          onboarding_step?: number | null;
          state_code?: string | null;
          timezone?: string | null;
        };
        Update: {
          area_id?: string | null;
          birth_month?: number | null;
          birth_year?: number | null;
          community_duration_id?: string | null;
          id?: string;
          onboarding_completed_at?: string | null;
          onboarding_step?: number | null;
          state_code?: string | null;
          timezone?: string | null;
        };
        Relationships: [];
      };
      providers: {
        Row: {
          id: string;
          is_active: boolean;
          name: string;
        };
        Insert: {
          id?: string;
          is_active?: boolean;
          name: string;
        };
        Update: {
          id?: string;
          is_active?: boolean;
          name?: string;
        };
        Relationships: [];
      };
      reminder_durations: {
        Row: {
          amount: number;
          created_at: string;
          id: string;
          is_active: boolean;
          label: string;
          sort_order: number | null;
          unit: Database["public"]["Enums"]["reminder_duration_unit"];
        };
        Insert: {
          amount: number;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          label: string;
          sort_order?: number | null;
          unit: Database["public"]["Enums"]["reminder_duration_unit"];
        };
        Update: {
          amount?: number;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          label?: string;
          sort_order?: number | null;
          unit?: Database["public"]["Enums"]["reminder_duration_unit"];
        };
        Relationships: [];
      };
      resources: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean;
          phone: string | null;
          provider_id: string | null;
          thumbnail: string | null;
          title: string;
          type: string | null;
          updated_at: string;
          video_url: string | null;
          website_url: string | null;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          phone?: string | null;
          provider_id?: string | null;
          thumbnail?: string | null;
          title: string;
          type?: string | null;
          updated_at?: string;
          video_url?: string | null;
          website_url?: string | null;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          phone?: string | null;
          provider_id?: string | null;
          thumbnail?: string | null;
          title?: string;
          type?: string | null;
          updated_at?: string;
          video_url?: string | null;
          website_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "resources_provider_id_fkey";
            columns: ["provider_id"];
            isOneToOne: false;
            referencedRelation: "providers";
            referencedColumns: ["id"];
          },
        ];
      };
      states: {
        Row: {
          code: string;
          has_local_areas: boolean;
          is_active: boolean;
          name: string;
        };
        Insert: {
          code: string;
          has_local_areas?: boolean;
          is_active?: boolean;
          name: string;
        };
        Update: {
          code?: string;
          has_local_areas?: boolean;
          is_active?: boolean;
          name?: string;
        };
        Relationships: [];
      };
      user_devices: {
        Row: {
          app_version: string | null;
          id: string;
          install_id: string;
          last_seen_at: string | null;
          model: string | null;
          os_version: string | null;
          platform: "android" | "ios" | "web";
          push_token: string | null;
          user_id: string;
        };
        Insert: {
          app_version?: string | null;
          id?: string;
          install_id: string;
          last_seen_at?: string | null;
          model?: string | null;
          os_version?: string | null;
          platform: "android" | "ios" | "web";
          push_token?: string | null;
          user_id: string;
        };
        Update: {
          app_version?: string | null;
          id?: string;
          install_id?: string;
          last_seen_at?: string | null;
          model?: string | null;
          os_version?: string | null;
          platform?: "android" | "ios" | "web";
          push_token?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      user_onboarding_priorities: {
        Row: {
          category_id: string;
          user_id: string;
        };
        Insert: {
          category_id: string;
          user_id: string;
        };
        Update: {
          category_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_onboarding_priorities_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      user_path_categories: {
        Row: {
          added_at: string;
          goal_category_id: string;
          id: string;
          status: "done" | "in_progress" | "not_started";
          user_id: string;
        };
        Insert: {
          added_at?: string;
          goal_category_id?: string;
          id?: string;
          status?: "done" | "in_progress" | "not_started";
          user_id: string;
        };
        Update: {
          added_at?: string;
          goal_category_id?: string;
          id?: string;
          status?: "done" | "in_progress" | "not_started";
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_path_categories_goal_category_id_fkey";
            columns: ["goal_category_id"];
            isOneToOne: false;
            referencedRelation: "goal_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      user_path_task_completions: {
        Row: {
          completed_at: string;
          path_task_id: string;
          user_id: string;
        };
        Insert: {
          completed_at?: string;
          path_task_id: string;
          user_id: string;
        };
        Update: {
          completed_at?: string;
          path_task_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_path_task_completions_path_task_id_fkey";
            columns: ["path_task_id"];
            isOneToOne: false;
            referencedRelation: "path_tasks";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      complete_onboarding: {
        Args: Record<string, never>;
        Returns: undefined;
      };
    };
    Enums: {
      reminder_duration_unit: "minute" | "hour" | "day" | "week" | "month" | "year";
    };
    CompositeTypes: Record<string, never>;
  };
};
