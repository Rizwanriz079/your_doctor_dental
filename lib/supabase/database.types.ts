export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      appointment_events: {
        Row: {
          actor_id: string | null
          appointment_id: string
          created_at: string
          details: Json
          event_type: string
          from_status: string | null
          id: number
          note: string | null
          to_status: string | null
        }
        Insert: {
          actor_id?: string | null
          appointment_id: string
          created_at?: string
          details?: Json
          event_type: string
          from_status?: string | null
          id?: never
          note?: string | null
          to_status?: string | null
        }
        Update: {
          actor_id?: string | null
          appointment_id?: string
          created_at?: string
          details?: Json
          event_type?: string
          from_status?: string | null
          id?: never
          note?: string | null
          to_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_events_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          appointment_date: string
          booking_reference: string
          cancelled_at: string | null
          completed_at: string | null
          confirmed_at: string | null
          created_at: string
          doctor_id: string
          end_time: string
          hold_expires_at: string | null
          id: string
          patient_email: string | null
          patient_id: string | null
          patient_message: string | null
          patient_name: string
          patient_phone: string
          service_id: string
          start_time: string
          status: string
          status_reason: string | null
          time_range: unknown
          updated_at: string
          user_id: string | null
        }
        Insert: {
          appointment_date: string
          booking_reference: string
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          doctor_id: string
          end_time: string
          hold_expires_at?: string | null
          id?: string
          patient_email?: string | null
          patient_id?: string | null
          patient_message?: string | null
          patient_name: string
          patient_phone: string
          service_id: string
          start_time: string
          status?: string
          status_reason?: string | null
          time_range?: unknown
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          appointment_date?: string
          booking_reference?: string
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          doctor_id?: string
          end_time?: string
          hold_expires_at?: string | null
          id?: string
          patient_email?: string | null
          patient_id?: string | null
          patient_message?: string | null
          patient_name?: string
          patient_phone?: string
          service_id?: string
          start_time?: string
          status?: string
          status_reason?: string | null
          time_range?: unknown
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          changed_fields: string[]
          created_at: string
          id: number
          record_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          changed_fields?: string[]
          created_at?: string
          id?: never
          record_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          changed_fields?: string[]
          created_at?: string
          id?: never
          record_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      clinic_holidays: {
        Row: {
          created_at: string
          holiday_date: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          holiday_date: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          holiday_date?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      clinic_settings: {
        Row: {
          about_heading: string
          about_overview: string
          address: string
          benefits: Json
          booking_window_days: number
          clinic_name: string
          clinic_values: Json
          currency: string
          email: string
          facilities: string
          footer_text: string
          gallery: Json
          hero_eyebrow: string
          hero_heading: string
          hero_highlights: Json
          hero_image_path: string | null
          hero_text: string
          id: number
          logo_path: string | null
          map_embed_url: string
          map_url: string
          max_daily_capacity_limit: number
          min_notice_minutes: number
          mission: string
          opening_hours: Json
          pending_expiry_hours: number | null
          phone: string
          privacy_text: string
          require_email: boolean
          social_links: Json
          stats: Json
          tagline: string
          technology: string
          terms_text: string
          timezone: string
          updated_at: string
        }
        Insert: {
          about_heading?: string
          about_overview?: string
          address?: string
          benefits?: Json
          booking_window_days?: number
          clinic_name?: string
          clinic_values?: Json
          currency?: string
          email?: string
          facilities?: string
          footer_text?: string
          gallery?: Json
          hero_eyebrow?: string
          hero_heading?: string
          hero_highlights?: Json
          hero_image_path?: string | null
          hero_text?: string
          id?: number
          logo_path?: string | null
          map_embed_url?: string
          map_url?: string
          max_daily_capacity_limit?: number
          min_notice_minutes?: number
          mission?: string
          opening_hours?: Json
          pending_expiry_hours?: number | null
          phone?: string
          privacy_text?: string
          require_email?: boolean
          social_links?: Json
          stats?: Json
          tagline?: string
          technology?: string
          terms_text?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          about_heading?: string
          about_overview?: string
          address?: string
          benefits?: Json
          booking_window_days?: number
          clinic_name?: string
          clinic_values?: Json
          currency?: string
          email?: string
          facilities?: string
          footer_text?: string
          gallery?: Json
          hero_eyebrow?: string
          hero_heading?: string
          hero_highlights?: Json
          hero_image_path?: string | null
          hero_text?: string
          id?: number
          logo_path?: string | null
          map_embed_url?: string
          map_url?: string
          max_daily_capacity_limit?: number
          min_notice_minutes?: number
          mission?: string
          opening_hours?: Json
          pending_expiry_hours?: number | null
          phone?: string
          privacy_text?: string
          require_email?: boolean
          social_links?: Json
          stats?: Json
          tagline?: string
          technology?: string
          terms_text?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      doctor_capacity: {
        Row: {
          capacity_date: string
          created_at: string
          created_by: string | null
          doctor_id: string
          id: string
          max_bookings: number
          reason: string
          updated_at: string
        }
        Insert: {
          capacity_date: string
          created_at?: string
          created_by?: string | null
          doctor_id: string
          id?: string
          max_bookings: number
          reason?: string
          updated_at?: string
        }
        Update: {
          capacity_date?: string
          created_at?: string
          created_by?: string | null
          doctor_id?: string
          id?: string
          max_bookings?: number
          reason?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_capacity_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_private: {
        Row: {
          doctor_id: string
          email: string
          internal_notes: string
          phone: string
        }
        Insert: {
          doctor_id: string
          email?: string
          internal_notes?: string
          phone?: string
        }
        Update: {
          doctor_id?: string
          email?: string
          internal_notes?: string
          phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_private_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: true
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_schedule_overrides: {
        Row: {
          created_at: string
          created_by: string | null
          doctor_id: string
          end_time: string | null
          id: string
          is_closed: boolean
          reason: string
          schedule_date: string
          start_time: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          doctor_id: string
          end_time?: string | null
          id?: string
          is_closed?: boolean
          reason?: string
          schedule_date: string
          start_time?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          doctor_id?: string
          end_time?: string | null
          id?: string
          is_closed?: boolean
          reason?: string
          schedule_date?: string
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctor_schedule_overrides_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_schedules: {
        Row: {
          created_at: string
          doctor_id: string
          end_time: string
          id: string
          start_time: string
          updated_at: string
          weekday: number
        }
        Insert: {
          created_at?: string
          doctor_id: string
          end_time: string
          id?: string
          start_time: string
          updated_at?: string
          weekday: number
        }
        Update: {
          created_at?: string
          doctor_id?: string
          end_time?: string
          id?: string
          start_time?: string
          updated_at?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "doctor_schedules_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_services: {
        Row: {
          doctor_id: string
          service_id: string
        }
        Insert: {
          doctor_id: string
          service_id: string
        }
        Update: {
          doctor_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_services_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          accepting_bookings: boolean
          archived_at: string | null
          biography: string
          buffer_minutes: number
          created_at: string
          default_appointment_duration_minutes: number
          default_daily_capacity: number
          experience_years: number | null
          full_name: string
          id: string
          profile_image_path: string | null
          qualification: string
          show_on_homepage: boolean
          slug: string
          sort_order: number
          specialization: string
          status: string
          updated_at: string
        }
        Insert: {
          accepting_bookings?: boolean
          archived_at?: string | null
          biography?: string
          buffer_minutes?: number
          created_at?: string
          default_appointment_duration_minutes?: number
          default_daily_capacity: number
          experience_years?: number | null
          full_name: string
          id?: string
          profile_image_path?: string | null
          qualification?: string
          show_on_homepage?: boolean
          slug: string
          sort_order?: number
          specialization: string
          status?: string
          updated_at?: string
        }
        Update: {
          accepting_bookings?: boolean
          archived_at?: string | null
          biography?: string
          buffer_minutes?: number
          created_at?: string
          default_appointment_duration_minutes?: number
          default_daily_capacity?: number
          experience_years?: number | null
          full_name?: string
          id?: string
          profile_image_path?: string | null
          qualification?: string
          show_on_homepage?: boolean
          slug?: string
          sort_order?: number
          specialization?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          appointment_id: string | null
          created_at: string
          data: Json
          doctor_id: string | null
          event_type: string
          id: string
          is_read: boolean
          message: string
          read_at: string | null
          recipient_user_id: string
          title: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          data?: Json
          doctor_id?: string | null
          event_type: string
          id?: string
          is_read?: boolean
          message: string
          read_at?: string | null
          recipient_user_id: string
          title: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          data?: Json
          doctor_id?: string | null
          event_type?: string
          id?: string
          is_read?: boolean
          message?: string
          read_at?: string | null
          recipient_user_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          last_booking_at: string | null
          phone: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          last_booking_at?: string | null
          phone: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          last_booking_at?: string | null
          phone?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          archived_at: string | null
          category: string
          created_at: string
          description: string
          duration_minutes: number | null
          id: string
          image_path: string | null
          is_active: boolean
          is_featured: boolean
          name: string
          price: number | null
          procedure_details: string
          short_description: string
          show_price: boolean
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          category?: string
          created_at?: string
          description?: string
          duration_minutes?: number | null
          id?: string
          image_path?: string | null
          is_active?: boolean
          is_featured?: boolean
          name: string
          price?: number | null
          procedure_details?: string
          short_description?: string
          show_price?: boolean
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          category?: string
          created_at?: string
          description?: string
          duration_minutes?: number | null
          id?: string
          image_path?: string | null
          is_active?: boolean
          is_featured?: boolean
          name?: string
          price?: number | null
          procedure_details?: string
          short_description?: string
          show_price?: boolean
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          author_display: string
          consent_confirmed: boolean
          content: string
          created_at: string
          id: string
          is_approved: boolean
          rating: number | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          author_display: string
          consent_confirmed?: boolean
          content: string
          created_at?: string
          id?: string
          is_approved?: boolean
          rating?: number | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          author_display?: string
          consent_confirmed?: boolean
          content?: string
          created_at?: string
          id?: string
          is_approved?: boolean
          rating?: number | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _booked_count: {
        Args: { p_date: string; p_doctor: string; p_exclude?: string }
        Returns: number
      }
      _compute_slots: {
        Args: {
          p_admin?: boolean
          p_date: string
          p_doctor: string
          p_exclude?: string
          p_service: string
        }
        Returns: Json
      }
      _consumes_capacity: {
        Args: { p_hold_expires_at: string; p_status: string }
        Returns: boolean
      }
      _doctor_change_impact: {
        Args: { p_capacity: number; p_doctor: string; p_schedules: Json }
        Returns: Json
      }
      _doctor_intervals: {
        Args: { p_date: string; p_doctor: string }
        Returns: {
          end_time: string
          start_time: string
        }[]
      }
      _effective_capacity: {
        Args: { p_date: string; p_doctor: string }
        Returns: number
      }
      _require_admin: { Args: never; Returns: undefined }
      _slugify: { Args: { p: string }; Returns: string }
      admin_add_appointment_note: {
        Args: { p_id: string; p_note: string }
        Returns: Json
      }
      admin_day_overview: { Args: { p_date: string }; Returns: Json }
      admin_delete_doctor: { Args: { p_id: string }; Returns: Json }
      admin_doctor_impact: {
        Args: { p_capacity: number; p_doctor: string; p_schedules: Json }
        Returns: Json
      }
      admin_doctor_range: {
        Args: { p_doctor: string; p_from: string; p_to: string }
        Returns: Json
      }
      admin_get_slots: {
        Args: {
          p_date: string
          p_doctor: string
          p_exclude?: string
          p_service: string
        }
        Returns: Json
      }
      admin_mark_notifications_read: {
        Args: { p_ids?: string[] }
        Returns: number
      }
      admin_reschedule_appointment: {
        Args: {
          p_id: string
          p_new_date: string
          p_new_start: string
          p_reason?: string
        }
        Returns: Json
      }
      admin_save_doctor: { Args: { p: Json }; Returns: Json }
      admin_save_service: { Args: { p: Json }; Returns: Json }
      admin_set_appointment_status: {
        Args: { p_id: string; p_reason?: string; p_status: string }
        Returns: Json
      }
      admin_set_capacity_override: {
        Args: {
          p_date: string
          p_doctor: string
          p_force?: boolean
          p_max: number
          p_reason?: string
        }
        Returns: Json
      }
      admin_set_doctor_status: {
        Args: { p_accepting: boolean; p_id: string; p_status: string }
        Returns: Json
      }
      admin_set_schedule_override: {
        Args: {
          p_closed: boolean
          p_date: string
          p_doctor: string
          p_end: string
          p_force?: boolean
          p_reason?: string
          p_start: string
        }
        Returns: Json
      }
      book_appointment: {
        Args: {
          p_consent: boolean
          p_date: string
          p_doctor_id: string
          p_message: string
          p_patient_email: string
          p_patient_name: string
          p_patient_phone: string
          p_service_id: string
          p_start_time: string
        }
        Returns: Json
      }
      expire_stale_holds: {
        Args: { p_date?: string; p_doctor?: string }
        Returns: number
      }
      get_available_slots: {
        Args: { p_date: string; p_doctor: string; p_service: string }
        Returns: Json
      }
      get_doctor_calendar: {
        Args: {
          p_doctor: string
          p_from: string
          p_service: string
          p_to: string
        }
        Returns: Json
      }
      is_admin: { Args: never; Returns: boolean }
      lookup_appointment: {
        Args: { p_phone: string; p_reference: string }
        Returns: Json
      }
      setup_status: { Args: never; Returns: Json }
      claim_first_admin: { Args: { p_full_name?: string }; Returns: Json }
      patient_cancel_appointment: {
        Args: { p_id: string; p_reason?: string }
        Returns: Json
      }
      patient_link_bookings: { Args: never; Returns: number }
      patient_my_appointments: { Args: never; Returns: Json }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

