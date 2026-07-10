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
    PostgrestVersion: "14.5"
  }
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
      achievements: {
        Row: {
          category: string
          created_at: string | null
          description: string
          icon: string
          id: string
          level: string | null
          name: string
          points: number | null
          requirement_type: string
          requirement_value: number
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          icon: string
          id?: string
          level?: string | null
          name: string
          points?: number | null
          requirement_type: string
          requirement_value: number
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          icon?: string
          id?: string
          level?: string | null
          name?: string
          points?: number | null
          requirement_type?: string
          requirement_value?: number
        }
        Relationships: []
      }
      action_xp_values: {
        Row: {
          action_key: string
          action_name: string
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
          xp_value: number
        }
        Insert: {
          action_key: string
          action_name: string
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          xp_value: number
        }
        Update: {
          action_key?: string
          action_name?: string
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          xp_value?: number
        }
        Relationships: []
      }
      admin_logs: {
        Row: {
          action_description: string
          action_type: string
          admin_email: string
          admin_id: string
          created_at: string
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action_description: string
          action_type: string
          admin_email: string
          admin_id: string
          created_at?: string
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action_description?: string
          action_type?: string
          admin_email?: string
          admin_id?: string
          created_at?: string
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      admin_notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          notification_type: string
          sent_at: string | null
          sent_by: string
          sent_by_email: string
          target_audience: string
          target_user_email: string | null
          target_user_id: string | null
          title: string
          total_sent: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          notification_type: string
          sent_at?: string | null
          sent_by: string
          sent_by_email: string
          target_audience: string
          target_user_email?: string | null
          target_user_id?: string | null
          title: string
          total_sent?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          notification_type?: string
          sent_at?: string | null
          sent_by?: string
          sent_by_email?: string
          target_audience?: string
          target_user_email?: string | null
          target_user_id?: string | null
          title?: string
          total_sent?: number | null
        }
        Relationships: []
      }
      admin_transfer_votes: {
        Row: {
          id: string
          user_id: string
          vote: boolean
          voted_at: string | null
          voting_id: string
        }
        Insert: {
          id?: string
          user_id: string
          vote: boolean
          voted_at?: string | null
          voting_id: string
        }
        Update: {
          id?: string
          user_id?: string
          vote?: boolean
          voted_at?: string | null
          voting_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_transfer_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_transfer_votes_voting_id_fkey"
            columns: ["voting_id"]
            isOneToOne: false
            referencedRelation: "admin_transfer_votings"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_transfer_votings: {
        Row: {
          approval_threshold: number | null
          candidate_id: string
          community_id: string
          completed_at: string | null
          created_at: string | null
          ends_at: string | null
          id: string
          initiated_by: string
          status: string | null
          total_members: number
          votes_no: number | null
          votes_yes: number | null
        }
        Insert: {
          approval_threshold?: number | null
          candidate_id: string
          community_id: string
          completed_at?: string | null
          created_at?: string | null
          ends_at?: string | null
          id?: string
          initiated_by: string
          status?: string | null
          total_members: number
          votes_no?: number | null
          votes_yes?: number | null
        }
        Update: {
          approval_threshold?: number | null
          candidate_id?: string
          community_id?: string
          completed_at?: string | null
          created_at?: string | null
          ends_at?: string | null
          id?: string
          initiated_by?: string
          status?: string | null
          total_members?: number
          votes_no?: number | null
          votes_yes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_transfer_votings_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_transfer_votings_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "church_communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_transfer_votings_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_moderation_logs: {
        Row: {
          action_result: Json | null
          action_taken: string
          executed_at: string
          id: string
          rule_id: string | null
          rule_name: string
          target_id: string
          target_type: string
          trigger_data: Json | null
          trigger_reason: string | null
        }
        Insert: {
          action_result?: Json | null
          action_taken: string
          executed_at?: string
          id?: string
          rule_id?: string | null
          rule_name: string
          target_id: string
          target_type: string
          trigger_data?: Json | null
          trigger_reason?: string | null
        }
        Update: {
          action_result?: Json | null
          action_taken?: string
          executed_at?: string
          id?: string
          rule_id?: string | null
          rule_name?: string
          target_id?: string
          target_type?: string
          trigger_data?: Json | null
          trigger_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auto_moderation_logs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "moderation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          badge_key: string
          category: string
          created_at: string | null
          description: string
          icon: string
          id: string
          name: string
          rarity: string
          unlock_criteria: Json
          xp_reward: number | null
        }
        Insert: {
          badge_key: string
          category: string
          created_at?: string | null
          description: string
          icon: string
          id?: string
          name: string
          rarity: string
          unlock_criteria: Json
          xp_reward?: number | null
        }
        Update: {
          badge_key?: string
          category?: string
          created_at?: string | null
          description?: string
          icon?: string
          id?: string
          name?: string
          rarity?: string
          unlock_criteria?: Json
          xp_reward?: number | null
        }
        Relationships: []
      }
      banned_words: {
        Row: {
          auto_action: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          pattern: string | null
          severity: string
          updated_at: string
          word: string
        }
        Insert: {
          auto_action?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          pattern?: string | null
          severity?: string
          updated_at?: string
          word: string
        }
        Update: {
          auto_action?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          pattern?: string | null
          severity?: string
          updated_at?: string
          word?: string
        }
        Relationships: []
      }
      bible_books: {
        Row: {
          abbrev: string
          id: number
          name: string
          testament: string
        }
        Insert: {
          abbrev: string
          id?: number
          name: string
          testament: string
        }
        Update: {
          abbrev?: string
          id?: number
          name?: string
          testament?: string
        }
        Relationships: []
      }
      bible_dictionary: {
        Row: {
          appearances_count: number | null
          bible_references: string[]
          biblical_context: string | null
          category: string
          created_at: string | null
          curiosities: string | null
          details: string
          historical_context: string | null
          id: string
          meaning: string | null
          origin: string | null
          related_terms: string[] | null
          summary: string
          term: string
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          appearances_count?: number | null
          bible_references: string[]
          biblical_context?: string | null
          category: string
          created_at?: string | null
          curiosities?: string | null
          details: string
          historical_context?: string | null
          id?: string
          meaning?: string | null
          origin?: string | null
          related_terms?: string[] | null
          summary: string
          term: string
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          appearances_count?: number | null
          bible_references?: string[]
          biblical_context?: string | null
          category?: string
          created_at?: string | null
          curiosities?: string | null
          details?: string
          historical_context?: string | null
          id?: string
          meaning?: string | null
          origin?: string | null
          related_terms?: string[] | null
          summary?: string
          term?: string
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: []
      }
      bible_notes: {
        Row: {
          book_abbrev: string
          book_name: string
          chapter: number
          created_at: string | null
          id: string
          note_text: string
          updated_at: string | null
          user_id: string
          verse_number: number
        }
        Insert: {
          book_abbrev: string
          book_name: string
          chapter: number
          created_at?: string | null
          id?: string
          note_text: string
          updated_at?: string | null
          user_id: string
          verse_number: number
        }
        Update: {
          book_abbrev?: string
          book_name?: string
          chapter?: number
          created_at?: string | null
          id?: string
          note_text?: string
          updated_at?: string | null
          user_id?: string
          verse_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "bible_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_question_answers: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_best: boolean | null
          likes_count: number | null
          question_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_best?: boolean | null
          likes_count?: number | null
          question_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_best?: boolean | null
          likes_count?: number | null
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_question_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "bible_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bible_question_answers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_question_likes: {
        Row: {
          answer_id: string | null
          created_at: string | null
          id: string
          question_id: string | null
          user_id: string
        }
        Insert: {
          answer_id?: string | null
          created_at?: string | null
          id?: string
          question_id?: string | null
          user_id: string
        }
        Update: {
          answer_id?: string | null
          created_at?: string | null
          id?: string
          question_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_question_likes_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "bible_question_answers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bible_question_likes_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "bible_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bible_question_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_questions: {
        Row: {
          answers_count: number | null
          body: string
          category: string | null
          created_at: string | null
          id: string
          likes_count: number | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          answers_count?: number | null
          body: string
          category?: string | null
          created_at?: string | null
          id?: string
          likes_count?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          answers_count?: number | null
          body?: string
          category?: string | null
          created_at?: string | null
          id?: string
          likes_count?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_questions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_reading_plans: {
        Row: {
          created_at: string | null
          current_day: number | null
          id: string
          is_active: boolean | null
          plan_name: string
          total_days: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_day?: number | null
          id?: string
          is_active?: boolean | null
          plan_name: string
          total_days?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_day?: number | null
          id?: string
          is_active?: boolean | null
          plan_name?: string
          total_days?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_reading_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_reading_position: {
        Row: {
          book_abbrev: string
          book_name: string
          chapter: number
          created_at: string | null
          last_read_at: string | null
          notifications_enabled: boolean | null
          updated_at: string | null
          user_id: string
          verse_number: number
        }
        Insert: {
          book_abbrev: string
          book_name: string
          chapter: number
          created_at?: string | null
          last_read_at?: string | null
          notifications_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
          verse_number: number
        }
        Update: {
          book_abbrev?: string
          book_name?: string
          chapter?: number
          created_at?: string | null
          last_read_at?: string | null
          notifications_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
          verse_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "bible_reading_position_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_reading_progress: {
        Row: {
          book_abbrev: string
          chapter: number
          completed_at: string | null
          id: string
          plan_id: string | null
          user_id: string
        }
        Insert: {
          book_abbrev: string
          chapter: number
          completed_at?: string | null
          id?: string
          plan_id?: string | null
          user_id: string
        }
        Update: {
          book_abbrev?: string
          chapter?: number
          completed_at?: string | null
          id?: string
          plan_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_reading_progress_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "bible_reading_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bible_reading_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_reading_sessions: {
        Row: {
          book_abbrev: string | null
          chapter: number | null
          created_at: string | null
          duration_seconds: number | null
          ended_at: string | null
          id: string
          started_at: string
          user_id: string
        }
        Insert: {
          book_abbrev?: string | null
          chapter?: number | null
          created_at?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          started_at: string
          user_id: string
        }
        Update: {
          book_abbrev?: string | null
          chapter?: number | null
          created_at?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_reading_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_reading_stats: {
        Row: {
          last_reading_at: string | null
          total_reading_seconds: number | null
          total_sessions: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          last_reading_at?: string | null
          total_reading_seconds?: number | null
          total_sessions?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          last_reading_at?: string | null
          total_reading_seconds?: number | null
          total_sessions?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_reading_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_studies: {
        Row: {
          application: string
          author: string | null
          category: string
          content: string
          created_at: string | null
          description: string
          duration: string
          id: string
          likes_count: number | null
          reflection_questions: string[]
          title: string
          type: string
          updated_at: string | null
          verses: string[]
          views_count: number | null
        }
        Insert: {
          application: string
          author?: string | null
          category: string
          content: string
          created_at?: string | null
          description: string
          duration: string
          id?: string
          likes_count?: number | null
          reflection_questions: string[]
          title: string
          type: string
          updated_at?: string | null
          verses: string[]
          views_count?: number | null
        }
        Update: {
          application?: string
          author?: string | null
          category?: string
          content?: string
          created_at?: string | null
          description?: string
          duration?: string
          id?: string
          likes_count?: number | null
          reflection_questions?: string[]
          title?: string
          type?: string
          updated_at?: string | null
          verses?: string[]
          views_count?: number | null
        }
        Relationships: []
      }
      bible_verse_highlights: {
        Row: {
          book_abbrev: string
          book_name: string
          chapter: number
          created_at: string | null
          highlight_color: string | null
          id: string
          updated_at: string | null
          user_id: string
          verse_number: number
          verse_text: string
        }
        Insert: {
          book_abbrev: string
          book_name: string
          chapter: number
          created_at?: string | null
          highlight_color?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
          verse_number: number
          verse_text: string
        }
        Update: {
          book_abbrev?: string
          book_name?: string
          chapter?: number
          created_at?: string | null
          highlight_color?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
          verse_number?: number
          verse_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_verse_highlights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_verses: {
        Row: {
          book_id: number | null
          chapter: number
          id: number
          text: string
          verse: number
        }
        Insert: {
          book_id?: number | null
          chapter: number
          id?: number
          text: string
          verse: number
        }
        Update: {
          book_id?: number | null
          chapter?: number
          id?: number
          text?: string
          verse?: number
        }
        Relationships: [
          {
            foreignKeyName: "bible_verses_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "bible_books"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string | null
          id: string
          reason: string | null
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string | null
          id?: string
          reason?: string | null
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string | null
          id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocked_users_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_users_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_daily_progress: {
        Row: {
          campaign_id: string
          completed_at: string | null
          day_number: number
          id: string
          prayed: boolean | null
          reading_duration_seconds: number | null
          user_id: string
        }
        Insert: {
          campaign_id: string
          completed_at?: string | null
          day_number: number
          id?: string
          prayed?: boolean | null
          reading_duration_seconds?: number | null
          user_id: string
        }
        Update: {
          campaign_id?: string
          completed_at?: string | null
          day_number?: number
          id?: string
          prayed?: boolean | null
          reading_duration_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_daily_progress_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "spiritual_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_daily_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          badge_reward: string | null
          challenge_type: string
          created_at: string | null
          description: string
          end_date: string
          icon: string
          id: string
          is_active: boolean | null
          points_reward: number | null
          requirement_type: string
          requirement_value: number
          start_date: string
          title: string
        }
        Insert: {
          badge_reward?: string | null
          challenge_type: string
          created_at?: string | null
          description: string
          end_date: string
          icon: string
          id?: string
          is_active?: boolean | null
          points_reward?: number | null
          requirement_type: string
          requirement_value: number
          start_date: string
          title: string
        }
        Update: {
          badge_reward?: string | null
          challenge_type?: string
          created_at?: string | null
          description?: string
          end_date?: string
          icon?: string
          id?: string
          is_active?: boolean | null
          points_reward?: number | null
          requirement_type?: string
          requirement_value?: number
          start_date?: string
          title?: string
        }
        Relationships: []
      }
      chat_conversation_settings: {
        Row: {
          cleared_at: string | null
          friend_id: string
          id: string
          is_muted: boolean
          is_pinned: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          cleared_at?: string | null
          friend_id: string
          id?: string
          is_muted?: boolean
          is_pinned?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          cleared_at?: string | null
          friend_id?: string
          id?: string
          is_muted?: boolean
          is_pinned?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_media: {
        Row: {
          created_at: string | null
          duration_seconds: number | null
          file_name: string | null
          file_size: number | null
          id: string
          media_type: string
          media_url: string
          message_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          duration_seconds?: number | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          media_type: string
          media_url: string
          message_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          media_type?: string
          media_url?: string
          message_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_media_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_media_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_preferences: {
        Row: {
          bubble_style: string | null
          created_at: string | null
          id: string
          receive_sound: string | null
          send_sound: string | null
          show_read_receipts: boolean | null
          sound_enabled: boolean | null
          theme: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bubble_style?: string | null
          created_at?: string | null
          id?: string
          receive_sound?: string | null
          send_sound?: string | null
          show_read_receipts?: boolean | null
          sound_enabled?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bubble_style?: string | null
          created_at?: string | null
          id?: string
          receive_sound?: string | null
          send_sound?: string | null
          show_read_receipts?: boolean | null
          sound_enabled?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_room_members: {
        Row: {
          id: string
          joined_at: string | null
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_room_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_room_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          room_id: string
          sender_id: string
          status: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          room_id: string
          sender_id: string
          status?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          room_id?: string
          sender_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_room_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_room_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          is_private: boolean | null
          name: string
          password_hash: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          is_private?: boolean | null
          name: string
          password_hash?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_private?: boolean | null
          name?: string
          password_hash?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      church_communities: {
        Row: {
          address: string | null
          banner_url: string | null
          church_name: string
          city: string | null
          complement: string | null
          country: string | null
          cover_image_url: string | null
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          main_verse: string | null
          maps_link: string | null
          member_count: number | null
          name: string
          neighborhood: string | null
          number: string | null
          state: string | null
          street: string | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          banner_url?: string | null
          church_name: string
          city?: string | null
          complement?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          main_verse?: string | null
          maps_link?: string | null
          member_count?: number | null
          name: string
          neighborhood?: string | null
          number?: string | null
          state?: string | null
          street?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          banner_url?: string | null
          church_name?: string
          city?: string | null
          complement?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          main_verse?: string | null
          maps_link?: string | null
          member_count?: number | null
          name?: string
          neighborhood?: string | null
          number?: string | null
          state?: string | null
          street?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "church_communities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      church_community_members: {
        Row: {
          community_id: string
          function_title: string | null
          id: string
          interests: string[] | null
          is_active: boolean | null
          joined_at: string | null
          left_at: string | null
          ministries: string[] | null
          role: string | null
          time_in_church: string | null
          user_id: string
        }
        Insert: {
          community_id: string
          function_title?: string | null
          id?: string
          interests?: string[] | null
          is_active?: boolean | null
          joined_at?: string | null
          left_at?: string | null
          ministries?: string[] | null
          role?: string | null
          time_in_church?: string | null
          user_id: string
        }
        Update: {
          community_id?: string
          function_title?: string | null
          id?: string
          interests?: string[] | null
          is_active?: boolean | null
          joined_at?: string | null
          left_at?: string | null
          ministries?: string[] | null
          role?: string | null
          time_in_church?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "church_community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "church_communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "church_community_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      church_leaders: {
        Row: {
          area_of_activity: string | null
          assumed_date: string | null
          bio: string | null
          community_id: string
          created_at: string | null
          display_order: number
          email: string | null
          favorite_verse: string | null
          hierarchy_level: number
          id: string
          is_active: boolean | null
          ministry: string | null
          name: string
          phone: string | null
          photo_url: string | null
          role: string
          user_id: string | null
          whatsapp: string | null
        }
        Insert: {
          area_of_activity?: string | null
          assumed_date?: string | null
          bio?: string | null
          community_id: string
          created_at?: string | null
          display_order?: number
          email?: string | null
          favorite_verse?: string | null
          hierarchy_level?: number
          id?: string
          is_active?: boolean | null
          ministry?: string | null
          name: string
          phone?: string | null
          photo_url?: string | null
          role: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          area_of_activity?: string | null
          assumed_date?: string | null
          bio?: string | null
          community_id?: string
          created_at?: string | null
          display_order?: number
          email?: string | null
          favorite_verse?: string | null
          hierarchy_level?: number
          id?: string
          is_active?: boolean | null
          ministry?: string | null
          name?: string
          phone?: string | null
          photo_url?: string | null
          role?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "church_leaders_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "church_communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "church_leaders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          event_id: string | null
          id: string
          prayer_id: string | null
          testimony_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          event_id?: string | null
          id?: string
          prayer_id?: string | null
          testimony_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          event_id?: string | null
          id?: string
          prayer_id?: string | null
          testimony_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_prayer_id_fkey"
            columns: ["prayer_id"]
            isOneToOne: false
            referencedRelation: "prayers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_testimony_id_fkey"
            columns: ["testimony_id"]
            isOneToOne: false
            referencedRelation: "testimonies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_action_history: {
        Row: {
          action_type: string
          community_id: string
          created_at: string | null
          details: Json | null
          id: string
          performed_by: string
          target_user_id: string | null
        }
        Insert: {
          action_type: string
          community_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          performed_by: string
          target_user_id?: string | null
        }
        Update: {
          action_type?: string
          community_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          performed_by?: string
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_action_history_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "church_communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_action_history_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_action_history_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_campaign_checkins: {
        Row: {
          campaign_id: string
          created_at: string
          day_number: number
          id: string
          note: string | null
          user_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          day_number: number
          id?: string
          note?: string | null
          user_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          day_number?: number
          id?: string
          note?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_campaign_checkins_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "community_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_campaign_checkins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      community_campaign_participants: {
        Row: {
          campaign_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "community_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_campaign_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      community_campaigns: {
        Row: {
          campaign_type: string
          community_id: string
          created_at: string
          created_by: string
          description: string | null
          duration_days: number
          id: string
          is_active: boolean
          name: string
          start_date: string
        }
        Insert: {
          campaign_type?: string
          community_id: string
          created_at?: string
          created_by: string
          description?: string | null
          duration_days?: number
          id?: string
          is_active?: boolean
          name: string
          start_date?: string
        }
        Update: {
          campaign_type?: string
          community_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          duration_days?: number
          id?: string
          is_active?: boolean
          name?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_campaigns_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "church_communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      community_cell_attendance: {
        Row: {
          cell_id: string
          community_id: string
          created_at: string
          guest_name: string | null
          id: string
          meeting_date: string
          recorded_by: string
          status: string
          user_id: string | null
        }
        Insert: {
          cell_id: string
          community_id: string
          created_at?: string
          guest_name?: string | null
          id?: string
          meeting_date: string
          recorded_by: string
          status: string
          user_id?: string | null
        }
        Update: {
          cell_id?: string
          community_id?: string
          created_at?: string
          guest_name?: string | null
          id?: string
          meeting_date?: string
          recorded_by?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_cell_attendance_cell_id_fkey"
            columns: ["cell_id"]
            isOneToOne: false
            referencedRelation: "community_cells"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_cell_attendance_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "church_communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_cell_attendance_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_cell_attendance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      community_cell_members: {
        Row: {
          cell_id: string
          community_id: string
          id: string
          is_active: boolean
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          cell_id: string
          community_id: string
          id?: string
          is_active?: boolean
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          cell_id?: string
          community_id?: string
          id?: string
          is_active?: boolean
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_cell_members_cell_id_fkey"
            columns: ["cell_id"]
            isOneToOne: false
            referencedRelation: "community_cells"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_cell_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "church_communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_cell_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      community_cells: {
        Row: {
          city: string | null
          community_id: string
          complement: string | null
          country: string | null
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          leader_name: string | null
          leader_user_id: string | null
          maps_link: string | null
          meeting_day: string | null
          meeting_time: string | null
          name: string
          neighborhood: string | null
          number: string | null
          photos: string[]
          state: string | null
          street: string | null
          supervisor_name: string | null
          theme: string | null
          updated_at: string
          verse: string | null
          vice_leader_name: string | null
          vice_leader_user_id: string | null
          weekly_objective: string | null
          zip_code: string | null
        }
        Insert: {
          city?: string | null
          community_id: string
          complement?: string | null
          country?: string | null
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          leader_name?: string | null
          leader_user_id?: string | null
          maps_link?: string | null
          meeting_day?: string | null
          meeting_time?: string | null
          name: string
          neighborhood?: string | null
          number?: string | null
          photos?: string[]
          state?: string | null
          street?: string | null
          supervisor_name?: string | null
          theme?: string | null
          updated_at?: string
          verse?: string | null
          vice_leader_name?: string | null
          vice_leader_user_id?: string | null
          weekly_objective?: string | null
          zip_code?: string | null
        }
        Update: {
          city?: string | null
          community_id?: string
          complement?: string | null
          country?: string | null
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          leader_name?: string | null
          leader_user_id?: string | null
          maps_link?: string | null
          meeting_day?: string | null
          meeting_time?: string | null
          name?: string
          neighborhood?: string | null
          number?: string | null
          photos?: string[]
          state?: string | null
          street?: string | null
          supervisor_name?: string | null
          theme?: string | null
          updated_at?: string
          verse?: string | null
          vice_leader_name?: string | null
          vice_leader_user_id?: string | null
          weekly_objective?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_cells_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "church_communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_cells_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_cells_leader_user_id_fkey"
            columns: ["leader_user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_cells_vice_leader_user_id_fkey"
            columns: ["vice_leader_user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      community_comments: {
        Row: {
          audio_url: string | null
          community_id: string
          created_at: string | null
          evaluation_id: string | null
          id: string
          is_anonymous: boolean | null
          text_content: string | null
          updated_at: string | null
          user_id: string
          voting_id: string | null
        }
        Insert: {
          audio_url?: string | null
          community_id: string
          created_at?: string | null
          evaluation_id?: string | null
          id?: string
          is_anonymous?: boolean | null
          text_content?: string | null
          updated_at?: string | null
          user_id: string
          voting_id?: string | null
        }
        Update: {
          audio_url?: string | null
          community_id?: string
          created_at?: string | null
          evaluation_id?: string | null
          id?: string
          is_anonymous?: boolean | null
          text_content?: string | null
          updated_at?: string | null
          user_id?: string
          voting_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "church_communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "leader_evaluations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_voting_id_fkey"
            columns: ["voting_id"]
            isOneToOne: false
            referencedRelation: "community_votings"
            referencedColumns: ["id"]
          },
        ]
      }
      community_post_amens: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_post_amens_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_post_amens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      community_post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_post_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          applications: string | null
          attachments: Json
          audio_url: string | null
          community_id: string
          content: string
          created_at: string
          id: string
          image_url: string | null
          is_pinned: boolean
          pdf_url: string | null
          reflection_questions: string | null
          title: string | null
          type: string
          updated_at: string
          user_id: string
          verse_reference: string | null
          verse_text: string | null
          video_url: string | null
          youtube_url: string | null
        }
        Insert: {
          applications?: string | null
          attachments?: Json
          audio_url?: string | null
          community_id: string
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_pinned?: boolean
          pdf_url?: string | null
          reflection_questions?: string | null
          title?: string | null
          type?: string
          updated_at?: string
          user_id: string
          verse_reference?: string | null
          verse_text?: string | null
          video_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          applications?: string | null
          attachments?: Json
          audio_url?: string | null
          community_id?: string
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_pinned?: boolean
          pdf_url?: string | null
          reflection_questions?: string | null
          title?: string | null
          type?: string
          updated_at?: string
          user_id?: string
          verse_reference?: string | null
          verse_text?: string | null
          video_url?: string | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "church_communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      community_quiz_attempts: {
        Row: {
          answers: Json
          community_id: string
          completed_at: string
          correct_count: number
          id: string
          quiz_id: string
          score_percent: number
          total_gradable: number
          user_id: string
        }
        Insert: {
          answers?: Json
          community_id: string
          completed_at?: string
          correct_count?: number
          id?: string
          quiz_id: string
          score_percent?: number
          total_gradable?: number
          user_id: string
        }
        Update: {
          answers?: Json
          community_id?: string
          completed_at?: string
          correct_count?: number
          id?: string
          quiz_id?: string
          score_percent?: number
          total_gradable?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_quiz_attempts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "church_communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "community_quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      community_quiz_questions: {
        Row: {
          correct_answer: Json | null
          id: string
          options: Json
          order_index: number
          points: number
          question_text: string
          quiz_id: string
          type: string
        }
        Insert: {
          correct_answer?: Json | null
          id?: string
          options?: Json
          order_index?: number
          points?: number
          question_text: string
          quiz_id: string
          type: string
        }
        Update: {
          correct_answer?: Json | null
          id?: string
          options?: Json
          order_index?: number
          points?: number
          question_text?: string
          quiz_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "community_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      community_quizzes: {
        Row: {
          community_id: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          passing_score: number
          timer_minutes: number | null
          title: string
        }
        Insert: {
          community_id: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          passing_score?: number
          timer_minutes?: number | null
          title: string
        }
        Update: {
          community_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          passing_score?: number
          timer_minutes?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_quizzes_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "church_communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_quizzes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      community_reactions: {
        Row: {
          comment_id: string | null
          created_at: string | null
          evaluation_id: string | null
          id: string
          reaction_type: string
          user_id: string
          voting_id: string | null
        }
        Insert: {
          comment_id?: string | null
          created_at?: string | null
          evaluation_id?: string | null
          id?: string
          reaction_type: string
          user_id: string
          voting_id?: string | null
        }
        Update: {
          comment_id?: string | null
          created_at?: string | null
          evaluation_id?: string | null
          id?: string
          reaction_type?: string
          user_id?: string
          voting_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_reactions_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "leader_evaluations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_reactions_voting_id_fkey"
            columns: ["voting_id"]
            isOneToOne: false
            referencedRelation: "community_votings"
            referencedColumns: ["id"]
          },
        ]
      }
      community_votes: {
        Row: {
          id: string
          is_public: boolean | null
          option_id: string
          user_id: string
          voted_at: string | null
          voting_id: string
        }
        Insert: {
          id?: string
          is_public?: boolean | null
          option_id: string
          user_id: string
          voted_at?: string | null
          voting_id: string
        }
        Update: {
          id?: string
          is_public?: boolean | null
          option_id?: string
          user_id?: string
          voted_at?: string | null
          voting_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_votes_voting_id_fkey"
            columns: ["voting_id"]
            isOneToOne: false
            referencedRelation: "community_votings"
            referencedColumns: ["id"]
          },
        ]
      }
      community_votings: {
        Row: {
          community_id: string
          created_at: string | null
          created_by: string
          description: string | null
          ends_at: string | null
          id: string
          is_anonymous_votes: boolean | null
          options: Json
          starts_at: string | null
          status: string | null
          title: string
          updated_at: string | null
          voting_type: string | null
        }
        Insert: {
          community_id: string
          created_at?: string | null
          created_by: string
          description?: string | null
          ends_at?: string | null
          id?: string
          is_anonymous_votes?: boolean | null
          options: Json
          starts_at?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          voting_type?: string | null
        }
        Update: {
          community_id?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          is_anonymous_votes?: boolean | null
          options?: Json
          starts_at?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          voting_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_votings_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "church_communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_votings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          last_read_at: string | null
          last_read_message_id: string | null
          left_at: string | null
          permissions: Json | null
          role: Database["public"]["Enums"]["participant_role"]
          unread_count: number | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          last_read_message_id?: string | null
          left_at?: string | null
          permissions?: Json | null
          role?: Database["public"]["Enums"]["participant_role"]
          unread_count?: number | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          last_read_message_id?: string | null
          left_at?: string | null
          permissions?: Json | null
          role?: Database["public"]["Enums"]["participant_role"]
          unread_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          archived_at: string | null
          avatar_url: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          last_message_at: string | null
          name: string | null
          participant_1_id: string | null
          participant_2_id: string | null
          settings: Json | null
          type: Database["public"]["Enums"]["conversation_type"]
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          last_message_at?: string | null
          name?: string | null
          participant_1_id?: string | null
          participant_2_id?: string | null
          settings?: Json | null
          type: Database["public"]["Enums"]["conversation_type"]
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          last_message_at?: string | null
          name?: string | null
          participant_1_id?: string | null
          participant_2_id?: string | null
          settings?: Json | null
          type?: Database["public"]["Enums"]["conversation_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_participant_1_id_fkey"
            columns: ["participant_1_id"]
            isOneToOne: false
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_2_id_fkey"
            columns: ["participant_2_id"]
            isOneToOne: false
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_biblical_challenges: {
        Row: {
          category: string | null
          challenge_date: string | null
          challenge_text: string
          created_at: string | null
          difficulty_level: string | null
          id: string
          motivational_quote: string
          points_reward: number | null
        }
        Insert: {
          category?: string | null
          challenge_date?: string | null
          challenge_text: string
          created_at?: string | null
          difficulty_level?: string | null
          id?: string
          motivational_quote: string
          points_reward?: number | null
        }
        Update: {
          category?: string | null
          challenge_date?: string | null
          challenge_text?: string
          created_at?: string | null
          difficulty_level?: string | null
          id?: string
          motivational_quote?: string
          points_reward?: number | null
        }
        Relationships: []
      }
      daily_challenge_completions: {
        Row: {
          challenge_id: string
          completed_at: string | null
          id: string
          points_earned: number | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          id?: string
          points_earned?: number | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          id?: string
          points_earned?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_challenge_completions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "daily_biblical_challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_challenge_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_challenges: {
        Row: {
          challenge_date: string
          challenges: Json
          created_at: string | null
          id: string
        }
        Insert: {
          challenge_date: string
          challenges: Json
          created_at?: string | null
          id?: string
        }
        Update: {
          challenge_date?: string
          challenges?: Json
          created_at?: string | null
          id?: string
        }
        Relationships: []
      }
      daily_verse_history: {
        Row: {
          book_id: number
          chapter: number
          created_at: string | null
          date: string
          favorites_count: number | null
          id: string
          shares_count: number | null
          text: string
          updated_at: string | null
          verse: number
          views_count: number | null
        }
        Insert: {
          book_id: number
          chapter: number
          created_at?: string | null
          date: string
          favorites_count?: number | null
          id?: string
          shares_count?: number | null
          text: string
          updated_at?: string | null
          verse: number
          views_count?: number | null
        }
        Update: {
          book_id?: number
          chapter?: number
          created_at?: string | null
          date?: string
          favorites_count?: number | null
          id?: string
          shares_count?: number | null
          text?: string
          updated_at?: string | null
          verse?: number
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_verse_history_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "bible_books"
            referencedColumns: ["id"]
          },
        ]
      }
      devotional_completions: {
        Row: {
          completed_at: string
          devotional_id: string
          id: string
          reflection: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          devotional_id: string
          id?: string
          reflection?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string
          devotional_id?: string
          id?: string
          reflection?: string | null
          user_id?: string
        }
        Relationships: []
      }
      devotionals: {
        Row: {
          category: string
          challenge: string
          created_at: string | null
          date: string | null
          id: string
          practical_application: string
          prayer: string
          reflection: string
          time_of_day: string
          title: string
          updated_at: string | null
          verse_reference: string
          verse_text: string
        }
        Insert: {
          category: string
          challenge: string
          created_at?: string | null
          date?: string | null
          id?: string
          practical_application: string
          prayer: string
          reflection: string
          time_of_day: string
          title: string
          updated_at?: string | null
          verse_reference: string
          verse_text: string
        }
        Update: {
          category?: string
          challenge?: string
          created_at?: string | null
          date?: string | null
          id?: string
          practical_application?: string
          prayer?: string
          reflection?: string
          time_of_day?: string
          title?: string
          updated_at?: string | null
          verse_reference?: string
          verse_text?: string
        }
        Relationships: []
      }
      event_participants: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          city: string
          country: string | null
          created_at: string | null
          description: string
          event_date: string
          id: string
          image_url: string | null
          location: string
          participant_count: number | null
          title: string
          updated_at: string | null
          user_id: string
          video_url: string | null
        }
        Insert: {
          city: string
          country?: string | null
          created_at?: string | null
          description: string
          event_date: string
          id?: string
          image_url?: string | null
          location: string
          participant_count?: number | null
          title: string
          updated_at?: string | null
          user_id: string
          video_url?: string | null
        }
        Update: {
          city?: string
          country?: string | null
          created_at?: string | null
          description?: string
          event_date?: string
          id?: string
          image_url?: string | null
          location?: string
          participant_count?: number | null
          title?: string
          updated_at?: string | null
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      faith_posts: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          id: string
          recipient_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          recipient_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          recipient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "faith_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faith_posts_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_verses: {
        Row: {
          book: string
          chapter: number
          created_at: string | null
          id: string
          user_id: string
          verse: number
          verse_text: string
        }
        Insert: {
          book: string
          chapter: number
          created_at?: string | null
          id?: string
          user_id: string
          verse: number
          verse_text: string
        }
        Update: {
          book?: string
          chapter?: number
          created_at?: string | null
          id?: string
          user_id?: string
          verse?: number
          verse_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_verses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_favorites: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_reactions: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string
          reaction: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          reaction: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          reaction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      followers: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "followers_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followers_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friend_requests: {
        Row: {
          created_at: string | null
          id: string
          receiver_id: string
          sender_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          receiver_id: string
          sender_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          receiver_id?: string
          sender_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "friend_requests_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friend_requests_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friend_testimonials: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          id: string
          recipient_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          recipient_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          recipient_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "friend_testimonials_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friend_testimonials_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          created_at: string | null
          id: string
          user_id_1: string
          user_id_2: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id_1: string
          user_id_2: string
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id_1?: string
          user_id_2?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_user_id_1_fkey"
            columns: ["user_id_1"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_user_id_2_fkey"
            columns: ["user_id_2"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          game_key: string
          id: string
          level: number
          state: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          game_key?: string
          id?: string
          level: number
          state: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          game_key?: string
          id?: string
          level?: number
          state?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      leader_evaluations: {
        Row: {
          audio_url: string | null
          community_id: string
          created_at: string | null
          id: string
          is_anonymous: boolean | null
          leader_id: string
          rating: number | null
          text_content: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          audio_url?: string | null
          community_id: string
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          leader_id: string
          rating?: number | null
          text_content?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          audio_url?: string | null
          community_id?: string
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          leader_id?: string
          rating?: number | null
          text_content?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leader_evaluations_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "church_communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leader_evaluations_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "church_leaders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leader_evaluations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_snapshots: {
        Row: {
          created_at: string | null
          id: string
          leaderboard_type: string
          rankings: Json
          snapshot_date: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          leaderboard_type: string
          rankings: Json
          snapshot_date: string
        }
        Update: {
          created_at?: string | null
          id?: string
          leaderboard_type?: string
          rankings?: Json
          snapshot_date?: string
        }
        Relationships: []
      }
      message_reactions: {
        Row: {
          created_at: string | null
          id: string
          message_id: string
          reaction: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_id: string
          reaction: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message_id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_receipts: {
        Row: {
          delivered_at: string | null
          id: string
          message_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          delivered_at?: string | null
          id?: string
          message_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          delivered_at?: string | null
          id?: string
          message_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_receipts_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_receipts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          message_id: string
          reason: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          message_id: string
          reason: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          message_id?: string
          reason?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_reports_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string | null
          deleted_at: string | null
          edited_at: string | null
          expires_at: string | null
          hashtags: string[] | null
          id: string
          is_pinned: boolean | null
          is_read: boolean | null
          is_starred: boolean | null
          link_preview: Json | null
          media_duration: number | null
          media_size: number | null
          media_thumbnail: string | null
          media_type: string | null
          media_url: string | null
          mentions: string[] | null
          message_type: string | null
          receiver_id: string
          reply_to_id: string | null
          scheduled_for: string | null
          sender_id: string
          shared_content: Json | null
          status: string | null
          tsv: unknown
          type: Database["public"]["Enums"]["message_type"] | null
          waveform: Json | null
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          expires_at?: string | null
          hashtags?: string[] | null
          id?: string
          is_pinned?: boolean | null
          is_read?: boolean | null
          is_starred?: boolean | null
          link_preview?: Json | null
          media_duration?: number | null
          media_size?: number | null
          media_thumbnail?: string | null
          media_type?: string | null
          media_url?: string | null
          mentions?: string[] | null
          message_type?: string | null
          receiver_id: string
          reply_to_id?: string | null
          scheduled_for?: string | null
          sender_id: string
          shared_content?: Json | null
          status?: string | null
          tsv?: unknown
          type?: Database["public"]["Enums"]["message_type"] | null
          waveform?: Json | null
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          expires_at?: string | null
          hashtags?: string[] | null
          id?: string
          is_pinned?: boolean | null
          is_read?: boolean | null
          is_starred?: boolean | null
          link_preview?: Json | null
          media_duration?: number | null
          media_size?: number | null
          media_thumbnail?: string | null
          media_type?: string | null
          media_url?: string | null
          mentions?: string[] | null
          message_type?: string | null
          receiver_id?: string
          reply_to_id?: string | null
          scheduled_for?: string | null
          sender_id?: string
          shared_content?: Json | null
          status?: string | null
          tsv?: unknown
          type?: Database["public"]["Enums"]["message_type"] | null
          waveform?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_rules: {
        Row: {
          action_params: Json | null
          action_type: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          priority: number
          trigger_type: string
          trigger_value: Json
        }
        Insert: {
          action_params?: Json | null
          action_type: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          priority?: number
          trigger_type: string
          trigger_value?: Json
        }
        Update: {
          action_params?: Json | null
          action_type?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          priority?: number
          trigger_type?: string
          trigger_value?: Json
        }
        Relationships: []
      }
      nearby_churches: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          cover_image_url: string | null
          created_at: string | null
          denomination: string | null
          description: string | null
          id: string
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          neighborhood: string | null
          operating_hours: string | null
          phone: string | null
          social_media: string | null
          state: string | null
          updated_at: string | null
          user_id: string
          whatsapp: string | null
          worship_days: string[] | null
          worship_times: string[] | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          denomination?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          neighborhood?: string | null
          operating_hours?: string | null
          phone?: string | null
          social_media?: string | null
          state?: string | null
          updated_at?: string | null
          user_id: string
          whatsapp?: string | null
          worship_days?: string[] | null
          worship_times?: string[] | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          denomination?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          neighborhood?: string | null
          operating_hours?: string | null
          phone?: string | null
          social_media?: string | null
          state?: string | null
          updated_at?: string | null
          user_id?: string
          whatsapp?: string | null
          worship_days?: string[] | null
          worship_times?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "nearby_churches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          message: string
          name: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          message: string
          name: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          message?: string
          name?: string
          title?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string | null
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          reference_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          reference_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          reference_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      photo_albums: {
        Row: {
          cover_photo_id: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cover_photo_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cover_photo_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_albums_cover_photo_id_fkey"
            columns: ["cover_photo_id"]
            isOneToOne: false
            referencedRelation: "profile_photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_albums_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          photo_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          photo_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          photo_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_comments_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "profile_photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_likes: {
        Row: {
          created_at: string | null
          id: string
          photo_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          photo_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          photo_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_likes_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "profile_photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          created_at: string
          id: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_id?: string
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          allows_multiple: boolean | null
          closes_at: string | null
          created_at: string
          id: string
          is_anonymous: boolean | null
          message_id: string
          options: Json
          question: string
        }
        Insert: {
          allows_multiple?: boolean | null
          closes_at?: string | null
          created_at?: string
          id?: string
          is_anonymous?: boolean | null
          message_id: string
          options: Json
          question: string
        }
        Update: {
          allows_multiple?: boolean | null
          closes_at?: string | null
          created_at?: string
          id?: string
          is_anonymous?: boolean | null
          message_id?: string
          options?: Json
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "polls_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          parent_id: string | null
          post_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          post_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          post_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          comments_count: number | null
          content: string | null
          created_at: string | null
          id: string
          is_hidden: boolean
          likes_count: number | null
          media_type: string | null
          media_url: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_hidden?: boolean
          likes_count?: number | null
          media_type?: string | null
          media_url?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_hidden?: boolean
          likes_count?: number | null
          media_type?: string | null
          media_url?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prayer_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          prayer_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          prayer_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          prayer_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prayer_comments_prayer_id_fkey"
            columns: ["prayer_id"]
            isOneToOne: false
            referencedRelation: "prayers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prayer_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prayer_group_member_stats: {
        Row: {
          group_id: string
          id: string
          prayers_created: number | null
          prayers_interceded: number | null
          scheduled_prayers_attended: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          prayers_created?: number | null
          prayers_interceded?: number | null
          scheduled_prayers_attended?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          prayers_created?: number | null
          prayers_interceded?: number | null
          scheduled_prayers_attended?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prayer_group_member_stats_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "prayer_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prayer_group_member_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prayer_group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prayer_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "prayer_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prayer_group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prayer_group_stats: {
        Row: {
          active_members_count: number | null
          answered_prayers: number | null
          group_id: string
          scheduled_prayers_count: number | null
          total_members: number | null
          total_prayers: number | null
          updated_at: string | null
        }
        Insert: {
          active_members_count?: number | null
          answered_prayers?: number | null
          group_id: string
          scheduled_prayers_count?: number | null
          total_members?: number | null
          total_prayers?: number | null
          updated_at?: string | null
        }
        Update: {
          active_members_count?: number | null
          answered_prayers?: number | null
          group_id?: string
          scheduled_prayers_count?: number | null
          total_members?: number | null
          total_prayers?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prayer_group_stats_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: true
            referencedRelation: "prayer_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      prayer_groups: {
        Row: {
          category: string
          cover_image_url: string | null
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          invite_code: string | null
          is_public: boolean | null
          member_count: number | null
          name: string
          updated_at: string | null
        }
        Insert: {
          category: string
          cover_image_url?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          invite_code?: string | null
          is_public?: boolean | null
          member_count?: number | null
          name: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          invite_code?: string | null
          is_public?: boolean | null
          member_count?: number | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prayer_groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prayer_intercessors: {
        Row: {
          created_at: string | null
          id: string
          prayer_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          prayer_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          prayer_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prayer_intercessors_prayer_id_fkey"
            columns: ["prayer_id"]
            isOneToOne: false
            referencedRelation: "prayers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prayer_intercessors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prayers: {
        Row: {
          answer_testimony: string | null
          answered_at: string | null
          audio_url: string | null
          category: string
          created_at: string | null
          description: string
          group_id: string | null
          id: string
          intercessor_count: number | null
          is_answered: boolean | null
          is_featured: boolean | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          answer_testimony?: string | null
          answered_at?: string | null
          audio_url?: string | null
          category: string
          created_at?: string | null
          description: string
          group_id?: string | null
          id?: string
          intercessor_count?: number | null
          is_answered?: boolean | null
          is_featured?: boolean | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          answer_testimony?: string | null
          answered_at?: string | null
          audio_url?: string | null
          category?: string
          created_at?: string | null
          description?: string
          group_id?: string | null
          id?: string
          intercessor_count?: number | null
          is_answered?: boolean | null
          is_featured?: boolean | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prayers_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "prayer_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prayers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_photos: {
        Row: {
          album_id: string | null
          caption: string | null
          compression_ratio: number | null
          created_at: string | null
          id: string
          is_hidden: boolean
          likes_count: number | null
          location: string | null
          medium_url: string | null
          optimized_size: number | null
          original_size: number | null
          photo_url: string
          thumbnail_url: string | null
          updated_at: string | null
          user_id: string
          visibility: string | null
        }
        Insert: {
          album_id?: string | null
          caption?: string | null
          compression_ratio?: number | null
          created_at?: string | null
          id?: string
          is_hidden?: boolean
          likes_count?: number | null
          location?: string | null
          medium_url?: string | null
          optimized_size?: number | null
          original_size?: number | null
          photo_url: string
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id: string
          visibility?: string | null
        }
        Update: {
          album_id?: string | null
          caption?: string | null
          compression_ratio?: number | null
          created_at?: string | null
          id?: string
          is_hidden?: boolean
          likes_count?: number | null
          location?: string | null
          medium_url?: string | null
          optimized_size?: number | null
          original_size?: number | null
          photo_url?: string
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_photos_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "photo_albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_medium_url: string | null
          avatar_thumbnail_url: string | null
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          church_name: string | null
          church_role: string | null
          city: string | null
          country: string | null
          cover_image_url: string | null
          cover_medium_url: string | null
          cover_thumbnail_url: string | null
          created_at: string | null
          full_name: string
          id: string
          is_private: boolean | null
          marital_status: string | null
          ministries: string[] | null
          preferred_language: string | null
          profile_quote: string | null
          set_language_manually: boolean | null
          updated_at: string | null
          username: string
        }
        Insert: {
          avatar_medium_url?: string | null
          avatar_thumbnail_url?: string | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          church_name?: string | null
          church_role?: string | null
          city?: string | null
          country?: string | null
          cover_image_url?: string | null
          cover_medium_url?: string | null
          cover_thumbnail_url?: string | null
          created_at?: string | null
          full_name: string
          id: string
          is_private?: boolean | null
          marital_status?: string | null
          ministries?: string[] | null
          preferred_language?: string | null
          profile_quote?: string | null
          set_language_manually?: boolean | null
          updated_at?: string | null
          username: string
        }
        Update: {
          avatar_medium_url?: string | null
          avatar_thumbnail_url?: string | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          church_name?: string | null
          church_role?: string | null
          city?: string | null
          country?: string | null
          cover_image_url?: string | null
          cover_medium_url?: string | null
          cover_thumbnail_url?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          is_private?: boolean | null
          marital_status?: string | null
          ministries?: string[] | null
          preferred_language?: string | null
          profile_quote?: string | null
          set_language_manually?: boolean | null
          updated_at?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          bible_reference: string | null
          category: string
          correct_answer: string
          created_at: string | null
          difficulty: string
          explanation: string | null
          id: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          points: number | null
          question: string
        }
        Insert: {
          bible_reference?: string | null
          category: string
          correct_answer: string
          created_at?: string | null
          difficulty: string
          explanation?: string | null
          id?: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          points?: number | null
          question: string
        }
        Update: {
          bible_reference?: string | null
          category?: string
          correct_answer?: string
          created_at?: string | null
          difficulty?: string
          explanation?: string | null
          id?: string
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          points?: number | null
          question?: string
        }
        Relationships: []
      }
      quiz_scores: {
        Row: {
          current_level: string | null
          id: string
          total_answered: number | null
          total_correct: number | null
          total_points: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          current_level?: string | null
          id?: string
          total_answered?: number | null
          total_correct?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          current_level?: string | null
          id?: string
          total_answered?: number | null
          total_correct?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_user_answers: {
        Row: {
          answered_at: string | null
          id: string
          is_correct: boolean
          points_earned: number | null
          question_id: string
          user_answer: string
          user_id: string
        }
        Insert: {
          answered_at?: string | null
          id?: string
          is_correct: boolean
          points_earned?: number | null
          question_id: string
          user_answer: string
          user_id: string
        }
        Update: {
          answered_at?: string | null
          id?: string
          is_correct?: boolean
          points_earned?: number | null
          question_id?: string
          user_answer?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_user_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_user_answers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          created_at: string | null
          description: string
          id: string
          is_active: boolean | null
          name: string
          reward_key: string
          reward_type: string
          reward_value: Json
          trigger_condition: Json | null
          trigger_type: string
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          is_active?: boolean | null
          name: string
          reward_key: string
          reward_type: string
          reward_value: Json
          trigger_condition?: Json | null
          trigger_type: string
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          is_active?: boolean | null
          name?: string
          reward_key?: string
          reward_type?: string
          reward_value?: Json
          trigger_condition?: Json | null
          trigger_type?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_messages: {
        Row: {
          collection_name: string | null
          created_at: string
          id: string
          message_id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          collection_name?: string | null
          created_at?: string
          id?: string
          message_id: string
          notes?: string | null
          user_id: string
        }
        Update: {
          collection_name?: string | null
          created_at?: string
          id?: string
          message_id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_messages_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_prayer_attendees: {
        Row: {
          confirmed_at: string | null
          id: string
          notified: boolean | null
          scheduled_prayer_id: string
          user_id: string
        }
        Insert: {
          confirmed_at?: string | null
          id?: string
          notified?: boolean | null
          scheduled_prayer_id: string
          user_id: string
        }
        Update: {
          confirmed_at?: string | null
          id?: string
          notified?: boolean | null
          scheduled_prayer_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_prayer_attendees_scheduled_prayer_id_fkey"
            columns: ["scheduled_prayer_id"]
            isOneToOne: false
            referencedRelation: "scheduled_prayers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_prayer_attendees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_prayers: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          group_id: string
          id: string
          is_recurring: boolean | null
          recurrence_type: string | null
          reminder_minutes: number | null
          scheduled_at: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          group_id: string
          id?: string
          is_recurring?: boolean | null
          recurrence_type?: string | null
          reminder_minutes?: number | null
          scheduled_at: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          group_id?: string
          id?: string
          is_recurring?: boolean | null
          recurrence_type?: string | null
          reminder_minutes?: number | null
          scheduled_at?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_prayers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_prayers_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "prayer_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_reading_badges: {
        Row: {
          badge_icon: string
          badge_name: string
          badge_type: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_icon: string
          badge_name: string
          badge_type: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_icon?: string
          badge_name?: string
          badge_type?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_reading_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_reading_participants: {
        Row: {
          finished_reading: boolean | null
          id: string
          is_host: boolean | null
          joined_at: string | null
          room_id: string
          total_points: number | null
          user_id: string
        }
        Insert: {
          finished_reading?: boolean | null
          id?: string
          is_host?: boolean | null
          joined_at?: string | null
          room_id: string
          total_points?: number | null
          user_id: string
        }
        Update: {
          finished_reading?: boolean | null
          id?: string
          is_host?: boolean | null
          joined_at?: string | null
          room_id?: string
          total_points?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_reading_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "shared_reading_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_reading_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_reading_quiz_answers: {
        Row: {
          answered_at: string | null
          chapter: number
          id: string
          is_correct: boolean | null
          question_index: number
          room_id: string
          selected_answer: string
          user_id: string
        }
        Insert: {
          answered_at?: string | null
          chapter: number
          id?: string
          is_correct?: boolean | null
          question_index: number
          room_id: string
          selected_answer: string
          user_id: string
        }
        Update: {
          answered_at?: string | null
          chapter?: number
          id?: string
          is_correct?: boolean | null
          question_index?: number
          room_id?: string
          selected_answer?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_reading_quiz_answers_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "shared_reading_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_reading_quiz_answers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_reading_reactions: {
        Row: {
          created_at: string | null
          id: string
          reaction: string
          room_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          reaction: string
          room_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          reaction?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_reading_reactions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "shared_reading_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_reading_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_reading_reflections: {
        Row: {
          application: string | null
          book_abbrev: string | null
          chapter: number
          created_at: string
          favorite_verse: string | null
          id: string
          reflection: string
          room_id: string
          user_id: string
        }
        Insert: {
          application?: string | null
          book_abbrev?: string | null
          chapter: number
          created_at?: string
          favorite_verse?: string | null
          id?: string
          reflection: string
          room_id: string
          user_id: string
        }
        Update: {
          application?: string | null
          book_abbrev?: string | null
          chapter?: number
          created_at?: string
          favorite_verse?: string | null
          id?: string
          reflection?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_reading_reflections_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "shared_reading_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_reading_reflections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_reading_rooms: {
        Row: {
          created_at: string | null
          current_book_abbrev: string | null
          current_chapter: number | null
          host_id: string
          id: string
          is_public: boolean | null
          max_participants: number | null
          quiz_questions: Json | null
          room_code: string
          room_name: string
          status: string | null
          updated_at: string | null
          verse_end: number | null
          verse_start: number | null
        }
        Insert: {
          created_at?: string | null
          current_book_abbrev?: string | null
          current_chapter?: number | null
          host_id: string
          id?: string
          is_public?: boolean | null
          max_participants?: number | null
          quiz_questions?: Json | null
          room_code: string
          room_name: string
          status?: string | null
          updated_at?: string | null
          verse_end?: number | null
          verse_start?: number | null
        }
        Update: {
          created_at?: string | null
          current_book_abbrev?: string | null
          current_chapter?: number | null
          host_id?: string
          id?: string
          is_public?: boolean | null
          max_participants?: number | null
          quiz_questions?: Json | null
          room_code?: string
          room_name?: string
          status?: string | null
          updated_at?: string | null
          verse_end?: number | null
          verse_start?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_reading_rooms_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_reading_stats: {
        Row: {
          current_streak: number | null
          longest_streak: number | null
          sessions_hosted: number | null
          total_chapters_completed: number | null
          total_correct_answers: number | null
          total_sessions: number | null
          total_wrong_answers: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          current_streak?: number | null
          longest_streak?: number | null
          sessions_hosted?: number | null
          total_chapters_completed?: number | null
          total_correct_answers?: number | null
          total_sessions?: number | null
          total_wrong_answers?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          current_streak?: number | null
          longest_streak?: number | null
          sessions_hosted?: number | null
          total_chapters_completed?: number | null
          total_correct_answers?: number | null
          total_sessions?: number | null
          total_wrong_answers?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_reading_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spiritual_campaigns: {
        Row: {
          campaign_type: string
          completed_at: string | null
          created_at: string | null
          current_day: number | null
          duration_days: number | null
          id: string
          is_active: boolean | null
          started_at: string | null
          user_id: string
        }
        Insert: {
          campaign_type: string
          completed_at?: string | null
          created_at?: string | null
          current_day?: number | null
          duration_days?: number | null
          id?: string
          is_active?: boolean | null
          started_at?: string | null
          user_id: string
        }
        Update: {
          campaign_type?: string
          completed_at?: string | null
          created_at?: string | null
          current_day?: number | null
          duration_days?: number | null
          id?: string
          is_active?: boolean | null
          started_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spiritual_campaigns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stickers: {
        Row: {
          approved_at: string | null
          category: string
          created_at: string
          creator_id: string | null
          file_url: string
          id: string
          is_animated: boolean | null
          is_official: boolean | null
          name: string
          thumbnail_url: string | null
          usage_count: number | null
        }
        Insert: {
          approved_at?: string | null
          category: string
          created_at?: string
          creator_id?: string | null
          file_url: string
          id?: string
          is_animated?: boolean | null
          is_official?: boolean | null
          name: string
          thumbnail_url?: string | null
          usage_count?: number | null
        }
        Update: {
          approved_at?: string | null
          category?: string
          created_at?: string
          creator_id?: string | null
          file_url?: string
          id?: string
          is_animated?: boolean | null
          is_official?: boolean | null
          name?: string
          thumbnail_url?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stickers_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonies: {
        Row: {
          audio_url: string | null
          content: string
          created_at: string | null
          glory_count: number | null
          id: string
          image_url: string | null
          likes_count: number | null
          title: string
          updated_at: string | null
          user_id: string
          video_url: string | null
        }
        Insert: {
          audio_url?: string | null
          content: string
          created_at?: string | null
          glory_count?: number | null
          id?: string
          image_url?: string | null
          likes_count?: number | null
          title: string
          updated_at?: string | null
          user_id: string
          video_url?: string | null
        }
        Update: {
          audio_url?: string | null
          content?: string
          created_at?: string | null
          glory_count?: number | null
          id?: string
          image_url?: string | null
          likes_count?: number | null
          title?: string
          updated_at?: string | null
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "testimonies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      testimony_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          testimony_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          testimony_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          testimony_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "testimony_comments_testimony_id_fkey"
            columns: ["testimony_id"]
            isOneToOne: false
            referencedRelation: "testimonies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "testimony_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      testimony_glories: {
        Row: {
          created_at: string | null
          id: string
          testimony_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          testimony_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          testimony_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "testimony_glories_testimony_id_fkey"
            columns: ["testimony_id"]
            isOneToOne: false
            referencedRelation: "testimonies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "testimony_glories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      testimony_likes: {
        Row: {
          created_at: string | null
          id: string
          testimony_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          testimony_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          testimony_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "testimony_likes_testimony_id_fkey"
            columns: ["testimony_id"]
            isOneToOne: false
            referencedRelation: "testimonies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "testimony_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      themes: {
        Row: {
          colors: Json
          created_at: string | null
          description: string | null
          effects: Json | null
          id: string
          is_active: boolean | null
          rarity: number | null
          theme_key: string
          theme_name: string
          tier: string | null
          updated_at: string | null
        }
        Insert: {
          colors?: Json
          created_at?: string | null
          description?: string | null
          effects?: Json | null
          id?: string
          is_active?: boolean | null
          rarity?: number | null
          theme_key: string
          theme_name: string
          tier?: string | null
          updated_at?: string | null
        }
        Update: {
          colors?: Json
          created_at?: string | null
          description?: string | null
          effects?: Json | null
          id?: string
          is_active?: boolean | null
          rarity?: number | null
          theme_key?: string
          theme_name?: string
          tier?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      typing_indicators: {
        Row: {
          conversation_id: string
          expires_at: string
          id: string
          is_recording: boolean | null
          is_typing: boolean | null
          started_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          expires_at?: string
          id?: string
          is_recording?: boolean | null
          is_typing?: boolean | null
          started_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          expires_at?: string
          id?: string
          is_recording?: boolean | null
          is_typing?: boolean | null
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "typing_indicators_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "typing_indicators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activities: {
        Row: {
          activity_date: string | null
          activity_type: string
          created_at: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          activity_date?: string | null
          activity_type: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          activity_date?: string | null
          activity_type?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_log: {
        Row: {
          action_type: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          display_order: number | null
          id: string
          is_equipped: boolean | null
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          badge_id: string
          display_order?: number | null
          id?: string
          is_equipped?: boolean | null
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          badge_id?: string
          display_order?: number | null
          id?: string
          is_equipped?: boolean | null
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      user_challenge_progress: {
        Row: {
          challenge_id: string
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          current_progress: number
          id: string
          updated_at: string | null
          user_id: string
          xp_earned: number | null
        }
        Insert: {
          challenge_id: string
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          current_progress?: number
          id?: string
          updated_at?: string | null
          user_id: string
          xp_earned?: number | null
        }
        Update: {
          challenge_id?: string
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          current_progress?: number
          id?: string
          updated_at?: string | null
          user_id?: string
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "weekly_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_challenges: {
        Row: {
          challenge_id: string
          completed_at: string | null
          created_at: string
          current_progress: number
          id: string
          is_completed: boolean
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          created_at?: string
          current_progress?: number
          id?: string
          is_completed?: boolean
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          created_at?: string
          current_progress?: number
          id?: string
          is_completed?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_daily_challenge_progress: {
        Row: {
          challenge_date: string
          challenge_index: number
          completed: boolean | null
          completed_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          challenge_date: string
          challenge_index: number
          completed?: boolean | null
          completed_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          challenge_date?: string
          challenge_index?: number
          completed?: boolean | null
          completed_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_daily_challenge_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorite_stickers: {
        Row: {
          created_at: string
          id: string
          sticker_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          sticker_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          sticker_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorite_stickers_sticker_id_fkey"
            columns: ["sticker_id"]
            isOneToOne: false
            referencedRelation: "stickers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorite_stickers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      user_presence: {
        Row: {
          device_info: Json | null
          last_seen: string
          status: Database["public"]["Enums"]["presence_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          device_info?: Json | null
          last_seen?: string
          status?: Database["public"]["Enums"]["presence_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          device_info?: Json | null
          last_seen?: string
          status?: Database["public"]["Enums"]["presence_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_presence_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      user_punishments: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          issued_at: string
          issued_by: string
          punishment_type: Database["public"]["Enums"]["user_punishment_type"]
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          issued_at?: string
          issued_by: string
          punishment_type: Database["public"]["Enums"]["user_punishment_type"]
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          issued_at?: string
          issued_by?: string
          punishment_type?: Database["public"]["Enums"]["user_punishment_type"]
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      user_reports: {
        Row: {
          content_id: string | null
          content_type: string | null
          created_at: string
          description: string | null
          id: string
          reason: string
          reported_user_id: string
          reporter_id: string
          resolution: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        Insert: {
          content_id?: string | null
          content_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reported_user_id: string
          reporter_id: string
          resolution?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          content_id?: string | null
          content_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reported_user_id?: string
          reporter_id?: string
          resolution?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Relationships: []
      }
      user_rewards: {
        Row: {
          claimed: boolean | null
          claimed_at: string | null
          expires_at: string | null
          id: string
          received_at: string | null
          reward_id: string
          user_id: string
        }
        Insert: {
          claimed?: boolean | null
          claimed_at?: string | null
          expires_at?: string | null
          id?: string
          received_at?: string | null
          reward_id: string
          user_id: string
        }
        Update: {
          claimed?: boolean | null
          claimed_at?: string | null
          expires_at?: string | null
          id?: string
          received_at?: string | null
          reward_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_rewards_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          expires_at: string | null
          granted_at: string
          granted_by: string | null
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stats: {
        Row: {
          bible_chapters_read: number
          current_streak: number
          events_participated: number
          last_activity_date: string | null
          last_streak_freeze_used: string | null
          level: number
          longest_streak: number
          prayers_created: number
          prayers_interceded: number
          streak_freeze_available: boolean | null
          testimonies_shared: number
          title: string | null
          total_points: number
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          bible_chapters_read?: number
          current_streak?: number
          events_participated?: number
          last_activity_date?: string | null
          last_streak_freeze_used?: string | null
          level?: number
          longest_streak?: number
          prayers_created?: number
          prayers_interceded?: number
          streak_freeze_available?: boolean | null
          testimonies_shared?: number
          title?: string | null
          total_points?: number
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          bible_chapters_read?: number
          current_streak?: number
          events_participated?: number
          last_activity_date?: string | null
          last_streak_freeze_used?: string | null
          level?: number
          longest_streak?: number
          prayers_created?: number
          prayers_interceded?: number
          streak_freeze_available?: boolean | null
          testimonies_shared?: number
          title?: string | null
          total_points?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      user_streaks: {
        Row: {
          current_streak: number
          last_activity_date: string | null
          last_login_date: string | null
          longest_streak: number
          streak_freeze_available: boolean | null
          streak_protected: boolean | null
          streak_started_at: string | null
          total_logins: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          current_streak?: number
          last_activity_date?: string | null
          last_login_date?: string | null
          longest_streak?: number
          streak_freeze_available?: boolean | null
          streak_protected?: boolean | null
          streak_started_at?: string | null
          total_logins?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          current_streak?: number
          last_activity_date?: string | null
          last_login_date?: string | null
          longest_streak?: number
          streak_freeze_available?: boolean | null
          streak_protected?: boolean | null
          streak_started_at?: string | null
          total_logins?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_study_completions: {
        Row: {
          completed_at: string | null
          id: string
          study_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          study_id: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          study_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_study_completions_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "bible_studies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_study_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      user_themes: {
        Row: {
          created_at: string | null
          expires_at: string | null
          grant_reason: string | null
          granted_by: string | null
          id: string
          is_active: boolean | null
          is_unlocked: boolean | null
          theme_key: string
          unlocked_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          grant_reason?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          is_unlocked?: boolean | null
          theme_key: string
          unlocked_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          grant_reason?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          is_unlocked?: boolean | null
          theme_key?: string
          unlocked_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_themes_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_themes_theme_key_fkey"
            columns: ["theme_key"]
            isOneToOne: false
            referencedRelation: "admin_theme_stats"
            referencedColumns: ["theme_key"]
          },
          {
            foreignKeyName: "user_themes_theme_key_fkey"
            columns: ["theme_key"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["theme_key"]
          },
          {
            foreignKeyName: "user_themes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      user_videos: {
        Row: {
          created_at: string | null
          description: string | null
          duration: number | null
          duration_seconds: number | null
          id: string
          likes_count: number
          location: string | null
          thumbnail_medium_url: string | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string
          user_id: string
          video_url: string
          views_count: number
          visibility: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration?: number | null
          duration_seconds?: number | null
          id?: string
          likes_count?: number
          location?: string | null
          thumbnail_medium_url?: string | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
          video_url: string
          views_count?: number
          visibility?: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration?: number | null
          duration_seconds?: number | null
          id?: string
          likes_count?: number
          location?: string | null
          thumbnail_medium_url?: string | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
          video_url?: string
          views_count?: number
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_videos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_word_search_achievements: {
        Row: {
          achievement_key: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_key: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_key?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_word_search_achievements_achievement_key_fkey"
            columns: ["achievement_key"]
            isOneToOne: false
            referencedRelation: "word_search_achievements"
            referencedColumns: ["achievement_key"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          current_level: number | null
          email: string | null
          full_name: string | null
          id: string
          last_active_date: string | null
          streak_days: number | null
          total_xp: number | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          current_level?: number | null
          email?: string | null
          full_name?: string | null
          id: string
          last_active_date?: string | null
          streak_days?: number | null
          total_xp?: number | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          current_level?: number | null
          email?: string | null
          full_name?: string | null
          id?: string
          last_active_date?: string | null
          streak_days?: number | null
          total_xp?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      verse_comment_likes: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verse_comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "verse_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verse_comment_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      verse_comment_reports: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          reason: string
          reporter_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          reason: string
          reporter_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          reason?: string
          reporter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verse_comment_reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "verse_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verse_comment_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      verse_comments: {
        Row: {
          book: string
          chapter: number
          comment_text: string
          created_at: string | null
          id: string
          is_hidden: boolean | null
          likes_count: number | null
          updated_at: string | null
          user_id: string
          verse: number
        }
        Insert: {
          book: string
          chapter: number
          comment_text: string
          created_at?: string | null
          id?: string
          is_hidden?: boolean | null
          likes_count?: number | null
          updated_at?: string | null
          user_id: string
          verse: number
        }
        Update: {
          book?: string
          chapter?: number
          comment_text?: string
          created_at?: string | null
          id?: string
          is_hidden?: boolean | null
          likes_count?: number | null
          updated_at?: string | null
          user_id?: string
          verse?: number
        }
        Relationships: [
          {
            foreignKeyName: "verse_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      verse_reactions: {
        Row: {
          book: string
          chapter: number
          created_at: string | null
          id: string
          reaction_type: string
          user_id: string
          verse: number
        }
        Insert: {
          book: string
          chapter: number
          created_at?: string | null
          id?: string
          reaction_type: string
          user_id: string
          verse: number
        }
        Update: {
          book?: string
          chapter?: number
          created_at?: string | null
          id?: string
          reaction_type?: string
          user_id?: string
          verse?: number
        }
        Relationships: [
          {
            foreignKeyName: "verse_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      verse_shares: {
        Row: {
          book: string
          chapter: number
          created_at: string | null
          id: string
          platform: string
          user_id: string
          verse: number
          verse_text: string
        }
        Insert: {
          book: string
          chapter: number
          created_at?: string | null
          id?: string
          platform: string
          user_id: string
          verse: number
          verse_text: string
        }
        Update: {
          book?: string
          chapter?: number
          created_at?: string | null
          id?: string
          platform?: string
          user_id?: string
          verse?: number
          verse_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "verse_shares_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      video_allowed_viewers: {
        Row: {
          created_at: string
          id: string
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_allowed_viewers_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "user_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
          video_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          video_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_comments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "user_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_likes: {
        Row: {
          created_at: string | null
          id: string
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_likes_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "user_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      vip_benefits: {
        Row: {
          benefit_key: string
          benefit_name: string
          benefit_value: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          updated_at: string
          vip_tier: string[] | null
        }
        Insert: {
          benefit_key: string
          benefit_name: string
          benefit_value: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
          vip_tier?: string[] | null
        }
        Update: {
          benefit_key?: string
          benefit_name?: string
          benefit_value?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
          vip_tier?: string[] | null
        }
        Relationships: []
      }
      vip_subscriptions: {
        Row: {
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          expires_at: string | null
          grant_reason: string | null
          granted_by: string | null
          id: string
          is_active: boolean
          metadata: Json | null
          started_at: string
          updated_at: string
          user_id: string
          vip_tier: string
        }
        Insert: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          expires_at?: string | null
          grant_reason?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          started_at?: string
          updated_at?: string
          user_id: string
          vip_tier?: string
        }
        Update: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          expires_at?: string | null
          grant_reason?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          started_at?: string
          updated_at?: string
          user_id?: string
          vip_tier?: string
        }
        Relationships: [
          {
            foreignKeyName: "vip_subscriptions_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vip_subscriptions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vip_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "admin_user_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_challenges: {
        Row: {
          badge_reward: string | null
          challenge_type: string
          created_at: string | null
          description: string
          end_date: string
          icon: string | null
          id: string
          is_active: boolean | null
          requirement_type: string
          requirement_value: number
          start_date: string
          title: string
          xp_reward: number
        }
        Insert: {
          badge_reward?: string | null
          challenge_type: string
          created_at?: string | null
          description: string
          end_date: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          requirement_type: string
          requirement_value: number
          start_date: string
          title: string
          xp_reward?: number
        }
        Update: {
          badge_reward?: string | null
          challenge_type?: string
          created_at?: string | null
          description?: string
          end_date?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          requirement_type?: string
          requirement_value?: number
          start_date?: string
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      word_search_achievements: {
        Row: {
          achievement_key: string
          created_at: string | null
          description: string
          icon: string
          id: string
          name: string
          xp_reward: number | null
        }
        Insert: {
          achievement_key: string
          created_at?: string | null
          description: string
          icon: string
          id?: string
          name: string
          xp_reward?: number | null
        }
        Update: {
          achievement_key?: string
          created_at?: string | null
          description?: string
          icon?: string
          id?: string
          name?: string
          xp_reward?: number | null
        }
        Relationships: []
      }
      word_search_level_completions: {
        Row: {
          chest_tier: string | null
          completed_at: string
          id: string
          level: number
          max_combo: number
          score: number
          stars: number
          theme_key: string | null
          theme_label: string | null
          user_id: string
          words_found_count: number
        }
        Insert: {
          chest_tier?: string | null
          completed_at?: string
          id?: string
          level: number
          max_combo?: number
          score?: number
          stars?: number
          theme_key?: string | null
          theme_label?: string | null
          user_id: string
          words_found_count?: number
        }
        Update: {
          chest_tier?: string | null
          completed_at?: string
          id?: string
          level?: number
          max_combo?: number
          score?: number
          stars?: number
          theme_key?: string | null
          theme_label?: string | null
          user_id?: string
          words_found_count?: number
        }
        Relationships: []
      }
      xp_history: {
        Row: {
          action_key: string
          created_at: string | null
          id: string
          metadata: Json | null
          user_id: string
          xp_earned: number
        }
        Insert: {
          action_key: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
          xp_earned: number
        }
        Update: {
          action_key?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
          xp_earned?: number
        }
        Relationships: []
      }
    }
    Views: {
      admin_all_photos: {
        Row: {
          caption: string | null
          comments_count: number | null
          created_at: string | null
          id: string | null
          is_hidden: boolean | null
          likes_count: number | null
          moderation_status: string | null
          pending_reports: number | null
          photo_type: string | null
          photo_url: string | null
          total_reports: number | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Relationships: []
      }
      admin_all_videos: {
        Row: {
          caption: string | null
          comments_count: number | null
          created_at: string | null
          duration_seconds: number | null
          id: string | null
          is_hidden: boolean | null
          likes_count: number | null
          moderation_status: string | null
          pending_reports: number | null
          thumbnail_url: string | null
          total_reports: number | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
          video_type: string | null
          video_url: string | null
          views_count: number | null
        }
        Relationships: []
      }
      admin_analytics_summary: {
        Row: {
          active_today: number | null
          active_week: number | null
          avg_level: number | null
          avg_xp: number | null
          comments_week: number | null
          likes_week: number | null
          new_users_month: number | null
          new_users_week: number | null
          pending_reports: number | null
          posts_week: number | null
          reports_week: number | null
          total_achievements_unlocked: number | null
          total_users: number | null
          vip_gold: number | null
          vip_platinum: number | null
          vip_standard: number | null
          vip_total: number | null
        }
        Relationships: []
      }
      admin_analytics_top_achievements: {
        Row: {
          name: string | null
          unlock_count: number | null
        }
        Relationships: []
      }
      admin_analytics_top_themes: {
        Row: {
          theme_name: string | null
          users_using: number | null
        }
        Relationships: []
      }
      admin_analytics_user_growth: {
        Row: {
          date: string | null
          new_users: number | null
        }
        Relationships: []
      }
      admin_dashboard_stats: {
        Row: {
          active_punishments: number | null
          pending_reports: number | null
          total_logs: number | null
          total_users: number | null
          users_today: number | null
          users_week: number | null
        }
        Relationships: []
      }
      admin_notifications_history: {
        Row: {
          created_at: string | null
          id: string | null
          message: string | null
          notification_type: string | null
          sent_at: string | null
          target_audience: string | null
          target_user_email: string | null
          title: string | null
          total_sent: number | null
        }
        Relationships: []
      }
      admin_recent_activity: {
        Row: {
          action_type: string | null
          actor: string | null
          created_at: string | null
          description: string | null
          id: string | null
          target_type: string | null
        }
        Relationships: []
      }
      admin_recent_photos: {
        Row: {
          caption: string | null
          comments_count: number | null
          created_at: string | null
          id: string | null
          is_hidden: boolean | null
          likes_count: number | null
          moderation_status: string | null
          pending_reports: number | null
          photo_type: string | null
          photo_url: string | null
          total_reports: number | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Relationships: []
      }
      admin_recent_videos: {
        Row: {
          caption: string | null
          comments_count: number | null
          created_at: string | null
          duration_seconds: number | null
          id: string | null
          is_hidden: boolean | null
          likes_count: number | null
          moderation_status: string | null
          pending_reports: number | null
          thumbnail_url: string | null
          total_reports: number | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
          video_type: string | null
          video_url: string | null
          views_count: number | null
        }
        Relationships: []
      }
      admin_reported_photos: {
        Row: {
          caption: string | null
          comments_count: number | null
          created_at: string | null
          id: string | null
          is_hidden: boolean | null
          likes_count: number | null
          moderation_status: string | null
          pending_reports: number | null
          photo_type: string | null
          photo_url: string | null
          total_reports: number | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Relationships: []
      }
      admin_reported_videos: {
        Row: {
          caption: string | null
          comments_count: number | null
          created_at: string | null
          duration_seconds: number | null
          id: string | null
          is_hidden: boolean | null
          likes_count: number | null
          moderation_status: string | null
          pending_reports: number | null
          thumbnail_url: string | null
          total_reports: number | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
          video_type: string | null
          video_url: string | null
          views_count: number | null
        }
        Relationships: []
      }
      admin_reports_detailed: {
        Row: {
          content_id: string | null
          content_type: string | null
          created_at: string | null
          description: string | null
          id: string | null
          reason: string | null
          reported_user_email: string | null
          reported_user_id: string | null
          reported_user_name: string | null
          reported_user_total_punishments: number | null
          reported_user_total_reports: number | null
          reporter_email: string | null
          reporter_id: string | null
          resolution: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
        }
        Relationships: []
      }
      admin_theme_stats: {
        Row: {
          description: string | null
          id: string | null
          is_active: boolean | null
          rarity: number | null
          theme_key: string | null
          theme_name: string | null
          unlock_type: string | null
          users_count: number | null
          users_using_now: number | null
          vip_tier_required: string | null
        }
        Relationships: []
      }
      admin_user_profile: {
        Row: {
          avatar_url: string | null
          current_theme: string | null
          email: string | null
          full_name: string | null
          id: string | null
          is_banned: boolean | null
          is_vip: boolean | null
          last_sign_in_at: string | null
          level: number | null
          registered_at: string | null
          risk_level: string | null
          risk_score: number | null
          total_achievements: number | null
          total_comments: number | null
          total_posts: number | null
          total_suspensions: number | null
          total_warnings: number | null
          total_xp: number | null
          vip_tier: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      apply_moderation_rules: {
        Args: { p_content?: string; p_target_id: string; p_target_type: string }
        Returns: {
          action_taken: string
          rule_applied: string
        }[]
      }
      apply_punishment: {
        Args: {
          p_duration_minutes?: number
          p_evidence?: Json
          p_issued_by?: string
          p_punishment_type: string
          p_reason: string
          p_user_id: string
        }
        Returns: string
      }
      approve_photo: {
        Args: { p_admin_id: string; p_photo_id: string; p_photo_type: string }
        Returns: boolean
      }
      award_xp: {
        Args: { p_action_key: string; p_metadata?: Json; p_user_id: string }
        Returns: {
          level_up: boolean
          new_level: number
          new_title: string
          old_level: number
          old_title: string
          total_xp: number
          xp_earned: number
        }[]
      }
      ban_user: {
        Args: { p_admin_id: string; p_reason: string; p_user_id: string }
        Returns: string
      }
      calculate_level_from_xp: { Args: { xp: number }; Returns: number }
      can_view_video: {
        Args: { video_row: Database["public"]["Tables"]["user_videos"]["Row"] }
        Returns: boolean
      }
      check_banned_words: {
        Args: { p_text: string }
        Returns: {
          auto_action: string
          severity: string
          word: string
        }[]
      }
      cleanup_expired_typing_indicators: { Args: never; Returns: undefined }
      community_member_role: {
        Args: { p_community_id: string; p_user_id: string }
        Returns: string
      }
      delete_photo: {
        Args: {
          p_admin_id: string
          p_photo_id: string
          p_photo_type: string
          p_reason?: string
        }
        Returns: boolean
      }
      get_active_theme: { Args: { p_user_id: string }; Returns: string }
      get_admin_fraud_signals: { Args: never; Returns: Json }
      get_admin_system_health: {
        Args: never
        Returns: {
          active_connections: number
          database_size_bytes: number
          total_activity_logs: number
          total_admin_logs: number
          total_comments: number
          total_photos: number
          total_posts: number
          total_prayers: number
          total_reports: number
          total_users: number
        }[]
      }
      get_available_themes: {
        Args: { p_user_id: string }
        Returns: {
          colors: Json
          description: string
          is_active: boolean
          is_unlocked: boolean
          rarity: number
          theme_key: string
          theme_name: string
          tier: string
        }[]
      }
      get_daily_verse: {
        Args: never
        Returns: {
          book_abbrev: string
          book_id: number
          book_name: string
          chapter: number
          text: string
          verse: number
        }[]
      }
      get_highest_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_or_create_private_conversation: {
        Args: { other_user_id: string }
        Returns: string
      }
      get_reported_content: {
        Args: { p_content_id: string; p_content_type: string }
        Returns: Json
      }
      get_testimonies_fast: {
        Args: never
        Returns: {
          audio_url: string
          content: string
          created_at: string
          glory_count: number
          id: string
          likes_count: number
          title: string
          updated_at: string
          user_id: string
          video_url: string
        }[]
      }
      get_title_from_level: { Args: { lvl: number }; Returns: string }
      get_trending_verses: {
        Args: { p_limit?: number }
        Returns: {
          book: string
          chapter: number
          score: number
          verse: number
          verse_text: string
        }[]
      }
      get_user_full_profile: { Args: { p_user_id: string }; Returns: Json }
      get_user_permissions: {
        Args: { input_user_id: string }
        Returns: {
          permission_description: string
          permission_name: string
        }[]
      }
      get_user_vip_benefits: {
        Args: { input_user_id: string }
        Returns: {
          benefit_key: string
          benefit_name: string
          benefit_value: Json
          description: string
        }[]
      }
      get_verse_stats: {
        Args: { p_book: string; p_chapter: number; p_verse: number }
        Returns: Json
      }
      get_vip_tier: { Args: { user_id: string }; Returns: string }
      get_xp_multiplier: { Args: { user_id: string }; Returns: number }
      grant_vip: {
        Args: {
          p_duration_days?: number
          p_grant_reason?: string
          p_granted_by?: string
          p_user_id: string
          p_vip_tier?: string
        }
        Returns: string
      }
      has_permission: {
        Args: { permission_name: string; user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          required_role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Returns: boolean
      }
      has_theme_unlocked: {
        Args: { p_theme_key: string; p_user_id: string }
        Returns: boolean
      }
      hide_photo: {
        Args: {
          p_admin_id: string
          p_photo_id: string
          p_photo_type: string
          p_reason?: string
        }
        Returns: boolean
      }
      is_admin: { Args: { user_id: string }; Returns: boolean }
      is_community_member: {
        Args: { p_community_id: string; p_user_id: string }
        Returns: boolean
      }
      is_reading_room_member: {
        Args: { p_room_id: string; p_user_id: string }
        Returns: boolean
      }
      is_vip: { Args: { user_id: string }; Returns: boolean }
      join_reading_room: {
        Args: { p_code: string }
        Returns: {
          created_at: string | null
          current_book_abbrev: string | null
          current_chapter: number | null
          host_id: string
          id: string
          is_public: boolean | null
          max_participants: number | null
          quiz_questions: Json | null
          room_code: string
          room_name: string
          status: string | null
          updated_at: string | null
          verse_end: number | null
          verse_start: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "shared_reading_rooms"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      log_admin_action: {
        Args: {
          p_action_description: string
          p_action_type: string
          p_admin_id: string
          p_target_id?: string
          p_target_type?: string
        }
        Returns: string
      }
      log_user_activity: {
        Args: { p_action_type: string; p_details?: Json; p_user_id: string }
        Returns: undefined
      }
      mark_messages_as_read: {
        Args: { conv_id: string; up_to_message_id: string }
        Returns: undefined
      }
      record_daily_verse_favorite: { Args: never; Returns: undefined }
      record_daily_verse_share: { Args: never; Returns: undefined }
      record_daily_verse_view: { Args: never; Returns: undefined }
      refresh_admin_stats: { Args: never; Returns: undefined }
      review_report: {
        Args: {
          p_action_taken: string
          p_moderator_notes?: string
          p_report_id: string
          p_reviewer_id: string
          p_status: string
        }
        Returns: boolean
      }
      revoke_vip: {
        Args: {
          p_cancel_reason?: string
          p_cancelled_by?: string
          p_user_id: string
        }
        Returns: boolean
      }
      send_mass_notification: {
        Args: {
          p_admin_id: string
          p_message: string
          p_notification_type: string
          p_target_audience: string
          p_title: string
        }
        Returns: string
      }
      send_user_notification: {
        Args: {
          p_admin_id: string
          p_message: string
          p_notification_type: string
          p_target_user_id: string
          p_title: string
        }
        Returns: string
      }
      set_active_theme: {
        Args: { p_theme_key: string; p_user_id: string }
        Returns: boolean
      }
      soft_delete_message: { Args: { message_id: string }; Returns: boolean }
      suspend_user: {
        Args: {
          p_admin_id: string
          p_duration_days?: number
          p_reason: string
          p_user_id: string
        }
        Returns: string
      }
      unlock_theme: {
        Args: {
          p_theme_key: string
          p_unlocked_via?: string
          p_user_id: string
        }
        Returns: string
      }
      update_user_streak: {
        Args: { p_user_id: string }
        Returns: {
          current_streak: number
          longest_streak: number
          milestone_reached: string
          streak_increased: boolean
        }[]
      }
      warn_user: {
        Args: { p_admin_id: string; p_reason: string; p_user_id: string }
        Returns: string
      }
    }
    Enums: {
      admin_action_type:
        | "user_warned"
        | "user_muted"
        | "user_unmuted"
        | "user_suspended"
        | "user_unsuspended"
        | "user_banned"
        | "user_unbanned"
        | "user_deleted"
        | "user_role_granted"
        | "user_role_revoked"
        | "user_vip_granted"
        | "user_vip_revoked"
        | "user_theme_granted"
        | "content_approved"
        | "content_rejected"
        | "content_deleted"
        | "content_edited"
        | "content_featured"
        | "report_resolved"
        | "report_rejected"
        | "settings_changed"
        | "permission_changed"
        | "theme_created"
        | "badge_created"
      conversation_type: "private" | "group" | "community" | "channel"
      message_status: "sending" | "sent" | "delivered" | "read" | "failed"
      message_type:
        | "text"
        | "audio"
        | "image"
        | "video"
        | "document"
        | "verse"
        | "prayer"
        | "testimony"
        | "event"
        | "poll"
        | "location"
        | "contact"
        | "sticker"
      participant_role: "owner" | "admin" | "moderator" | "member" | "visitor"
      presence_status:
        | "online"
        | "away"
        | "busy"
        | "praying"
        | "offline"
        | "invisible"
      user_punishment_type: "warning" | "mute" | "suspension" | "ban"
      user_role: "super_admin" | "admin" | "moderator" | "vip" | "user"
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
    Enums: {
      admin_action_type: [
        "user_warned",
        "user_muted",
        "user_unmuted",
        "user_suspended",
        "user_unsuspended",
        "user_banned",
        "user_unbanned",
        "user_deleted",
        "user_role_granted",
        "user_role_revoked",
        "user_vip_granted",
        "user_vip_revoked",
        "user_theme_granted",
        "content_approved",
        "content_rejected",
        "content_deleted",
        "content_edited",
        "content_featured",
        "report_resolved",
        "report_rejected",
        "settings_changed",
        "permission_changed",
        "theme_created",
        "badge_created",
      ],
      conversation_type: ["private", "group", "community", "channel"],
      message_status: ["sending", "sent", "delivered", "read", "failed"],
      message_type: [
        "text",
        "audio",
        "image",
        "video",
        "document",
        "verse",
        "prayer",
        "testimony",
        "event",
        "poll",
        "location",
        "contact",
        "sticker",
      ],
      participant_role: ["owner", "admin", "moderator", "member", "visitor"],
      presence_status: [
        "online",
        "away",
        "busy",
        "praying",
        "offline",
        "invisible",
      ],
      user_punishment_type: ["warning", "mute", "suspension", "ban"],
      user_role: ["super_admin", "admin", "moderator", "vip", "user"],
    },
  },
} as const
