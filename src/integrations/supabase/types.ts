export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      business_profile: {
        Row: {
          id: string
          user_id: string
          brand_name: string
          tagline: string | null
          services: string | null
          price_range: string | null
          ideal_client: string | null
          differentiator: string | null
          tone_and_style: string | null
          brand_story: string | null
          platforms: Json | null
          goals: string | null
          avoid_topics: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          brand_name?: string
          tagline?: string | null
          services?: string | null
          price_range?: string | null
          ideal_client?: string | null
          differentiator?: string | null
          tone_and_style?: string | null
          brand_story?: string | null
          platforms?: Json | null
          goals?: string | null
          avoid_topics?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          brand_name?: string
          tagline?: string | null
          services?: string | null
          price_range?: string | null
          ideal_client?: string | null
          differentiator?: string | null
          tone_and_style?: string | null
          brand_story?: string | null
          platforms?: Json | null
          goals?: string | null
          avoid_topics?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      competitor_content: {
        Row: {
          analysis_notes: string | null
          competitor_id: string
          content_body: string | null
          created_at: string
          engagement_metrics: Json | null
          id: string
          is_analyzed: boolean
          platform: string
          published_at: string | null
          tags: string[] | null
          title: string
          url: string | null
        }
        Insert: {
          analysis_notes?: string | null
          competitor_id: string
          content_body?: string | null
          created_at?: string
          engagement_metrics?: Json | null
          id?: string
          is_analyzed?: boolean
          platform: string
          published_at?: string | null
          tags?: string[] | null
          title: string
          url?: string | null
        }
        Update: {
          analysis_notes?: string | null
          competitor_id?: string
          content_body?: string | null
          created_at?: string
          engagement_metrics?: Json | null
          id?: string
          is_analyzed?: boolean
          platform?: string
          published_at?: string | null
          tags?: string[] | null
          title?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competitor_content_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitors"
            referencedColumns: ["id"]
          },
        ]
      }
      competitors: {
        Row: {
          agency_name: string | null
          audience_size: Json | null
          avatar_url: string | null
          content_style: string | null
          created_at: string
          frequency: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          platforms: Json | null
          tier: string | null
          what_they_sell: string | null
        }
        Insert: {
          agency_name?: string | null
          audience_size?: Json | null
          avatar_url?: string | null
          content_style?: string | null
          created_at?: string
          frequency?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          platforms?: Json | null
          tier?: string | null
          what_they_sell?: string | null
        }
        Update: {
          agency_name?: string | null
          audience_size?: Json | null
          avatar_url?: string | null
          content_style?: string | null
          created_at?: string
          frequency?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          platforms?: Json | null
          tier?: string | null
          what_they_sell?: string | null
        }
        Relationships: []
      }
      content_idea_pillars: {
        Row: {
          content_idea_id: string
          pillar_id: string
        }
        Insert: {
          content_idea_id: string
          pillar_id: string
        }
        Update: {
          content_idea_id?: string
          pillar_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_idea_pillars_content_idea_id_fkey"
            columns: ["content_idea_id"]
            isOneToOne: false
            referencedRelation: "content_ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_idea_pillars_pillar_id_fkey"
            columns: ["pillar_id"]
            isOneToOne: false
            referencedRelation: "content_pillars"
            referencedColumns: ["id"]
          },
        ]
      }
      content_ideas: {
        Row: {
          content_type: string | null
          created_at: string
          description: string | null
          draft_content: string | null
          feedback_status: string | null
          feedback_notes: string | null
          feedback_at: string | null
          id: string
          key_message: string | null
          performance: Json | null
          platform: string | null
          priority: string | null
          published_url: string | null
          scheduled_date: string | null
          source: string | null
          source_competitor_id: string | null
          source_content_id: string | null
          status: string
          target_audience: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          description?: string | null
          draft_content?: string | null
          feedback_status?: string | null
          feedback_notes?: string | null
          feedback_at?: string | null
          id?: string
          key_message?: string | null
          performance?: Json | null
          platform?: string | null
          priority?: string | null
          published_url?: string | null
          scheduled_date?: string | null
          source?: string | null
          source_competitor_id?: string | null
          source_content_id?: string | null
          status?: string
          target_audience?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content_type?: string | null
          created_at?: string
          description?: string | null
          draft_content?: string | null
          feedback_status?: string | null
          feedback_notes?: string | null
          feedback_at?: string | null
          id?: string
          key_message?: string | null
          performance?: Json | null
          platform?: string | null
          priority?: string | null
          published_url?: string | null
          scheduled_date?: string | null
          source?: string | null
          source_competitor_id?: string | null
          source_content_id?: string | null
          status?: string
          target_audience?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_ideas_source_competitor_id_fkey"
            columns: ["source_competitor_id"]
            isOneToOne: false
            referencedRelation: "competitors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_ideas_source_content_id_fkey"
            columns: ["source_content_id"]
            isOneToOne: false
            referencedRelation: "competitor_content"
            referencedColumns: ["id"]
          },
        ]
      }
      content_pillars: {
        Row: {
          color: string
          created_at: string
          description: string | null
          icon: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          color: string
          created_at?: string
          description?: string | null
          icon: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      weekly_briefs: {
        Row: {
          competitor_highlights: Json | null
          created_at: string
          id: string
          notes: string | null
          suggested_content: Json | null
          trending_topics: string[] | null
          week_start: string
        }
        Insert: {
          competitor_highlights?: Json | null
          created_at?: string
          id?: string
          notes?: string | null
          suggested_content?: Json | null
          trending_topics?: string[] | null
          week_start: string
        }
        Update: {
          competitor_highlights?: Json | null
          created_at?: string
          id?: string
          notes?: string | null
          suggested_content?: Json | null
          trending_topics?: string[] | null
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
