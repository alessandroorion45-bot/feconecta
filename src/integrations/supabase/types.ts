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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string
          created_at: string
          description: string
          icon: string
          id: string
          level: string
          name: string
          points: number
          requirement_type: string
          requirement_value: number
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          icon: string
          id?: string
          level?: string
          name: string
          points?: number
          requirement_type: string
          requirement_value: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          level?: string
          name?: string
          points?: number
          requirement_type?: string
          requirement_value?: number
        }
        Relationships: []
      }
      admin_transfer_votes: {
        Row: {
          id: string
          user_id: string
          vote: boolean
          voted_at: string
          voting_id: string
        }
        Insert: {
          id?: string
          user_id: string
          vote: boolean
          voted_at?: string
          voting_id: string
        }
        Update: {
          id?: string
          user_id?: string
          vote?: boolean
          voted_at?: string
          voting_id?: string
        }
        Relationships: [
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
          created_at: string
          ends_at: string | null
          id: string
          initiated_by: string
          status: string | null
          total_members: number
          votes_no: number
          votes_yes: number
        }
        Insert: {
          approval_threshold?: number | null
          candidate_id: string
          community_id: string
          completed_at?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          initiated_by: string
          status?: string | null
          total_members?: number
          votes_no?: number
          votes_yes?: number
        }
        Update: {
          approval_threshold?: number | null
          candidate_id?: string
          community_id?: string
          completed_at?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          initiated_by?: string
          status?: string | null
          total_members?: number
          votes_no?: number
          votes_yes?: number
        }
        Relationships: [
          {
            foreignKeyName: "admin_transfer_votings_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "church_communities"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_notes: {
        Row: {
          book_abbrev: string
          book_name: string
          chapter: number
          created_at: string
          id: string
          note_text: string
          updated_at: string
          user_id: string
          verse_number: number
        }
        Insert: {
          book_abbrev: string
          book_name: string
          chapter: number
          created_at?: string
          id?: string
          note_text: string
          updated_at?: string
          user_id: string
          verse_number: number
        }
        Update: {
          book_abbrev?: string
          book_name?: string
          chapter?: number
          created_at?: string
          id?: string
          note_text?: string
          updated_at?: string
          user_id?: string
          verse_number?: number
        }
        Relationships: []
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
        Relationships: []
      }
      bible_reading_plans: {
        Row: {
          created_at: string
          current_day: number
          id: string
          is_active: boolean
          plan_name: string
          total_days: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_day?: number
          id?: string
          is_active?: boolean
          plan_name: string
          total_days?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_day?: number
          id?: string
          is_active?: boolean
          plan_name?: string
          total_days?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bible_reading_position: {
        Row: {
          book_abbrev: string
          book_name: string
          chapter: number
          created_at: string
          last_read_at: string
          notifications_enabled: boolean
          updated_at: string
          user_id: string
          verse_number: number
        }
        Insert: {
          book_abbrev: string
          book_name: string
          chapter: number
          created_at?: string
          last_read_at?: string
          notifications_enabled?: boolean
          updated_at?: string
          user_id: string
          verse_number: number
        }
        Update: {
          book_abbrev?: string
          book_name?: string
          chapter?: number
          created_at?: string
          last_read_at?: string
          notifications_enabled?: boolean
          updated_at?: string
          user_id?: string
          verse_number?: number
        }
        Relationships: []
      }
      bible_reading_progress: {
        Row: {
          book_abbrev: string
          chapter: number
          completed_at: string
          id: string
          plan_id: string | null
          user_id: string
        }
        Insert: {
          book_abbrev: string
          chapter: number
          completed_at?: string
          id?: string
          plan_id?: string | null
          user_id: string
        }
        Update: {
          book_abbrev?: string
          chapter?: number
          completed_at?: string
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
        ]
      }
      bible_reading_sessions: {
        Row: {
          book_abbrev: string | null
          chapter: number | null
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          started_at: string
          user_id: string
        }
        Insert: {
          book_abbrev?: string | null
          chapter?: number | null
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          started_at?: string
          user_id: string
        }
        Update: {
          book_abbrev?: string | null
          chapter?: number | null
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bible_reading_stats: {
        Row: {
          last_reading_at: string | null
          total_reading_seconds: number
          total_sessions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          last_reading_at?: string | null
          total_reading_seconds?: number
          total_sessions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          last_reading_at?: string | null
          total_reading_seconds?: number
          total_sessions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bible_verse_highlights: {
        Row: {
          book_abbrev: string
          book_name: string
          chapter: number
          created_at: string
          highlight_color: string
          id: string
          updated_at: string
          user_id: string
          verse_number: number
          verse_text: string
        }
        Insert: {
          book_abbrev: string
          book_name: string
          chapter: number
          created_at?: string
          highlight_color?: string
          id?: string
          updated_at?: string
          user_id: string
          verse_number: number
          verse_text: string
        }
        Update: {
          book_abbrev?: string
          book_name?: string
          chapter?: number
          created_at?: string
          highlight_color?: string
          id?: string
          updated_at?: string
          user_id?: string
          verse_number?: number
          verse_text?: string
        }
        Relationships: []
      }
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
          reason: string | null
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
          reason?: string | null
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      campaign_daily_progress: {
        Row: {
          campaign_id: string
          completed_at: string
          day_number: number
          id: string
          prayed: boolean | null
          reading_duration_seconds: number | null
          user_id: string
        }
        Insert: {
          campaign_id: string
          completed_at?: string
          day_number: number
          id?: string
          prayed?: boolean | null
          reading_duration_seconds?: number | null
          user_id: string
        }
        Update: {
          campaign_id?: string
          completed_at?: string
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
        ]
      }
      challenges: {
        Row: {
          badge_reward: string | null
          challenge_type: string
          created_at: string
          description: string
          end_date: string
          icon: string
          id: string
          is_active: boolean
          points_reward: number
          requirement_type: string
          requirement_value: number
          start_date: string
          title: string
        }
        Insert: {
          badge_reward?: string | null
          challenge_type: string
          created_at?: string
          description: string
          end_date: string
          icon: string
          id?: string
          is_active?: boolean
          points_reward?: number
          requirement_type: string
          requirement_value: number
          start_date: string
          title: string
        }
        Update: {
          badge_reward?: string | null
          challenge_type?: string
          created_at?: string
          description?: string
          end_date?: string
          icon?: string
          id?: string
          is_active?: boolean
          points_reward?: number
          requirement_type?: string
          requirement_value?: number
          start_date?: string
          title?: string
        }
        Relationships: []
      }
      chat_media: {
        Row: {
          created_at: string
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
          created_at?: string
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
          created_at?: string
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
        ]
      }
      chat_preferences: {
        Row: {
          bubble_style: string | null
          created_at: string
          id: string
          receive_sound: string | null
          send_sound: string | null
          sound_enabled: boolean | null
          theme: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bubble_style?: string | null
          created_at?: string
          id?: string
          receive_sound?: string | null
          send_sound?: string | null
          sound_enabled?: boolean | null
          theme?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bubble_style?: string | null
          created_at?: string
          id?: string
          receive_sound?: string | null
          send_sound?: string | null
          sound_enabled?: boolean | null
          theme?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_room_members: {
        Row: {
          id: string
          joined_at: string
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
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
        ]
      }
      chat_room_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          room_id: string
          sender_id: string
          status: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          room_id: string
          sender_id: string
          status?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          room_id?: string
          sender_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_room_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_private: boolean
          name: string
          password_hash: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_private?: boolean
          name: string
          password_hash?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_private?: boolean
          name?: string
          password_hash?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      church_communities: {
        Row: {
          address: string | null
          church_name: string
          city: string | null
          country: string | null
          cover_image_url: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          member_count: number | null
          name: string
          state: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          church_name: string
          city?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          member_count?: number | null
          name: string
          state?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          church_name?: string
          city?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          member_count?: number | null
          name?: string
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      church_community_members: {
        Row: {
          community_id: string
          function_title: string | null
          id: string
          is_active: boolean | null
          joined_at: string
          left_at: string | null
          ministries: string[] | null
          role: string | null
          user_id: string
        }
        Insert: {
          community_id: string
          function_title?: string | null
          id?: string
          is_active?: boolean | null
          joined_at?: string
          left_at?: string | null
          ministries?: string[] | null
          role?: string | null
          user_id: string
        }
        Update: {
          community_id?: string
          function_title?: string | null
          id?: string
          is_active?: boolean | null
          joined_at?: string
          left_at?: string | null
          ministries?: string[] | null
          role?: string | null
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
        ]
      }
      church_leaders: {
        Row: {
          bio: string | null
          community_id: string
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          photo_url: string | null
          role: string
          user_id: string | null
        }
        Insert: {
          bio?: string | null
          community_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          photo_url?: string | null
          role: string
          user_id?: string | null
        }
        Update: {
          bio?: string | null
          community_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          photo_url?: string | null
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "church_leaders_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "church_communities"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          event_id: string | null
          id: string
          prayer_id: string | null
          testimony_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          event_id?: string | null
          id?: string
          prayer_id?: string | null
          testimony_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          event_id?: string | null
          id?: string
          prayer_id?: string | null
          testimony_id?: string | null
          updated_at?: string
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
          created_at: string
          details: Json | null
          id: string
          performed_by: string
          target_user_id: string | null
        }
        Insert: {
          action_type: string
          community_id: string
          created_at?: string
          details?: Json | null
          id?: string
          performed_by: string
          target_user_id?: string | null
        }
        Update: {
          action_type?: string
          community_id?: string
          created_at?: string
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
        ]
      }
      community_comments: {
        Row: {
          audio_url: string | null
          community_id: string
          created_at: string
          evaluation_id: string | null
          id: string
          is_anonymous: boolean | null
          text_content: string | null
          updated_at: string
          user_id: string
          voting_id: string | null
        }
        Insert: {
          audio_url?: string | null
          community_id: string
          created_at?: string
          evaluation_id?: string | null
          id?: string
          is_anonymous?: boolean | null
          text_content?: string | null
          updated_at?: string
          user_id: string
          voting_id?: string | null
        }
        Update: {
          audio_url?: string | null
          community_id?: string
          created_at?: string
          evaluation_id?: string | null
          id?: string
          is_anonymous?: boolean | null
          text_content?: string | null
          updated_at?: string
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
            foreignKeyName: "community_comments_voting_id_fkey"
            columns: ["voting_id"]
            isOneToOne: false
            referencedRelation: "community_votings"
            referencedColumns: ["id"]
          },
        ]
      }
      community_reactions: {
        Row: {
          comment_id: string | null
          created_at: string
          evaluation_id: string | null
          id: string
          reaction_type: string
          user_id: string
          voting_id: string | null
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          evaluation_id?: string | null
          id?: string
          reaction_type: string
          user_id: string
          voting_id?: string | null
        }
        Update: {
          comment_id?: string | null
          created_at?: string
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
          voted_at: string
          voting_id: string
        }
        Insert: {
          id?: string
          is_public?: boolean | null
          option_id: string
          user_id: string
          voted_at?: string
          voting_id: string
        }
        Update: {
          id?: string
          is_public?: boolean | null
          option_id?: string
          user_id?: string
          voted_at?: string
          voting_id?: string
        }
        Relationships: [
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
          created_at: string
          created_by: string
          description: string | null
          ends_at: string | null
          id: string
          is_anonymous_votes: boolean | null
          options: Json
          starts_at: string
          status: string | null
          title: string
          updated_at: string
          voting_type: string | null
        }
        Insert: {
          community_id: string
          created_at?: string
          created_by: string
          description?: string | null
          ends_at?: string | null
          id?: string
          is_anonymous_votes?: boolean | null
          options?: Json
          starts_at?: string
          status?: string | null
          title: string
          updated_at?: string
          voting_type?: string | null
        }
        Update: {
          community_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          is_anonymous_votes?: boolean | null
          options?: Json
          starts_at?: string
          status?: string | null
          title?: string
          updated_at?: string
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
        ]
      }
      daily_biblical_challenges: {
        Row: {
          category: string
          challenge_date: string
          challenge_text: string
          created_at: string
          difficulty_level: string
          id: string
          motivational_quote: string
          points_reward: number
        }
        Insert: {
          category?: string
          challenge_date?: string
          challenge_text: string
          created_at?: string
          difficulty_level?: string
          id?: string
          motivational_quote: string
          points_reward?: number
        }
        Update: {
          category?: string
          challenge_date?: string
          challenge_text?: string
          created_at?: string
          difficulty_level?: string
          id?: string
          motivational_quote?: string
          points_reward?: number
        }
        Relationships: []
      }
      daily_challenge_completions: {
        Row: {
          challenge_id: string
          completed_at: string
          id: string
          points_earned: number
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string
          id?: string
          points_earned?: number
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string
          id?: string
          points_earned?: number
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
        ]
      }
      event_participants: {
        Row: {
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
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
          created_at: string
          description: string
          event_date: string
          id: string
          image_url: string | null
          location: string
          participant_count: number
          title: string
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          city: string
          country?: string | null
          created_at?: string
          description: string
          event_date: string
          id?: string
          image_url?: string | null
          location: string
          participant_count?: number
          title: string
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          city?: string
          country?: string | null
          created_at?: string
          description?: string
          event_date?: string
          id?: string
          image_url?: string | null
          location?: string
          participant_count?: number
          title?: string
          updated_at?: string
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
        Relationships: []
      }
      favorite_verses: {
        Row: {
          book_abbrev: string
          book_name: string
          chapter: number
          created_at: string
          id: string
          user_id: string
          verse_number: number
          verse_text: string
        }
        Insert: {
          book_abbrev: string
          book_name: string
          chapter: number
          created_at?: string
          id?: string
          user_id: string
          verse_number: number
          verse_text: string
        }
        Update: {
          book_abbrev?: string
          book_name?: string
          chapter?: number
          created_at?: string
          id?: string
          user_id?: string
          verse_number?: number
          verse_text?: string
        }
        Relationships: []
      }
      followers: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
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
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          receiver_id: string
          sender_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          receiver_id?: string
          sender_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      friend_testimonials: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          recipient_id: string
          status: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          recipient_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          recipient_id?: string
          status?: string
          updated_at?: string
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
        Relationships: []
      }
      leader_evaluations: {
        Row: {
          audio_url: string | null
          community_id: string
          created_at: string
          id: string
          is_anonymous: boolean | null
          leader_id: string
          rating: number | null
          text_content: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          audio_url?: string | null
          community_id: string
          created_at?: string
          id?: string
          is_anonymous?: boolean | null
          leader_id: string
          rating?: number | null
          text_content?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          audio_url?: string | null
          community_id?: string
          created_at?: string
          id?: string
          is_anonymous?: boolean | null
          leader_id?: string
          rating?: number | null
          text_content?: string | null
          updated_at?: string
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
        ]
      }
      message_reactions: {
        Row: {
          created_at: string
          id: string
          message_id: string
          reaction: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          reaction: string
          user_id: string
        }
        Update: {
          created_at?: string
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
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          media_type: string | null
          media_url: string | null
          receiver_id: string
          sender_id: string
          status: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          media_type?: string | null
          media_url?: string | null
          receiver_id: string
          sender_id: string
          status?: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          media_type?: string | null
          media_url?: string | null
          receiver_id?: string
          sender_id?: string
          status?: string
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
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string | null
          content: string
          created_at: string
          id: string
          is_read: boolean
          reference_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          reference_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          reference_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      photo_albums: {
        Row: {
          cover_photo_id: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_photo_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_photo_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
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
        ]
      }
      photo_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          photo_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          photo_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          photo_id?: string
          updated_at?: string
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
        ]
      }
      photo_likes: {
        Row: {
          created_at: string
          id: string
          photo_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          photo_id: string
          user_id: string
        }
        Update: {
          created_at?: string
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
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
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
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          comments_count: number
          content: string | null
          created_at: string
          id: string
          likes_count: number
          media_type: string | null
          media_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          comments_count?: number
          content?: string | null
          created_at?: string
          id?: string
          likes_count?: number
          media_type?: string | null
          media_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          comments_count?: number
          content?: string | null
          created_at?: string
          id?: string
          likes_count?: number
          media_type?: string | null
          media_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      prayer_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          prayer_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          prayer_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
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
        ]
      }
      prayer_group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string | null
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
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
          created_at: string
          created_by: string
          description: string | null
          id: string
          invite_code: string | null
          is_public: boolean | null
          member_count: number | null
          name: string
          updated_at: string
        }
        Insert: {
          category: string
          cover_image_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          invite_code?: string | null
          is_public?: boolean | null
          member_count?: number | null
          name: string
          updated_at?: string
        }
        Update: {
          category?: string
          cover_image_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          invite_code?: string | null
          is_public?: boolean | null
          member_count?: number | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      prayer_intercessors: {
        Row: {
          created_at: string
          id: string
          prayer_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          prayer_id: string
          user_id: string
        }
        Update: {
          created_at?: string
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
          created_at: string
          description: string
          group_id: string | null
          id: string
          intercessor_count: number
          is_answered: boolean
          is_featured: boolean | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answer_testimony?: string | null
          answered_at?: string | null
          audio_url?: string | null
          category: string
          created_at?: string
          description: string
          group_id?: string | null
          id?: string
          intercessor_count?: number
          is_answered?: boolean
          is_featured?: boolean | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answer_testimony?: string | null
          answered_at?: string | null
          audio_url?: string | null
          category?: string
          created_at?: string
          description?: string
          group_id?: string | null
          id?: string
          intercessor_count?: number
          is_answered?: boolean
          is_featured?: boolean | null
          title?: string
          updated_at?: string
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
          created_at: string
          id: string
          likes_count: number
          location: string | null
          photo_url: string
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          album_id?: string | null
          caption?: string | null
          created_at?: string
          id?: string
          likes_count?: number
          location?: string | null
          photo_url: string
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          album_id?: string | null
          caption?: string | null
          created_at?: string
          id?: string
          likes_count?: number
          location?: string | null
          photo_url?: string
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_photos_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "photo_albums"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          church_name: string | null
          church_role: string | null
          city: string | null
          country: string | null
          cover_image_url: string | null
          created_at: string
          full_name: string
          id: string
          is_private: boolean | null
          marital_status: string | null
          ministries: string[] | null
          preferred_language: string | null
          profile_quote: string | null
          set_language_manually: boolean | null
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          church_name?: string | null
          church_role?: string | null
          city?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string
          full_name: string
          id: string
          is_private?: boolean | null
          marital_status?: string | null
          ministries?: string[] | null
          preferred_language?: string | null
          profile_quote?: string | null
          set_language_manually?: boolean | null
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          church_name?: string | null
          church_role?: string | null
          city?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_private?: boolean | null
          marital_status?: string | null
          ministries?: string[] | null
          preferred_language?: string | null
          profile_quote?: string | null
          set_language_manually?: boolean | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          category: string
          correct_answer: string
          created_at: string
          difficulty: string
          id: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          points: number
          question: string
        }
        Insert: {
          category: string
          correct_answer: string
          created_at?: string
          difficulty: string
          id?: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          points?: number
          question: string
        }
        Update: {
          category?: string
          correct_answer?: string
          created_at?: string
          difficulty?: string
          id?: string
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          points?: number
          question?: string
        }
        Relationships: []
      }
      quiz_scores: {
        Row: {
          current_level: string
          id: string
          total_answered: number
          total_correct: number
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_level?: string
          id?: string
          total_answered?: number
          total_correct?: number
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_level?: string
          id?: string
          total_answered?: number
          total_correct?: number
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_user_answers: {
        Row: {
          answered_at: string
          id: string
          is_correct: boolean
          points_earned: number
          question_id: string
          user_answer: string
          user_id: string
        }
        Insert: {
          answered_at?: string
          id?: string
          is_correct: boolean
          points_earned?: number
          question_id: string
          user_answer: string
          user_id: string
        }
        Update: {
          answered_at?: string
          id?: string
          is_correct?: boolean
          points_earned?: number
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
        ]
      }
      scheduled_prayer_attendees: {
        Row: {
          confirmed_at: string
          id: string
          notified: boolean | null
          scheduled_prayer_id: string
          user_id: string
        }
        Insert: {
          confirmed_at?: string
          id?: string
          notified?: boolean | null
          scheduled_prayer_id: string
          user_id: string
        }
        Update: {
          confirmed_at?: string
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
        ]
      }
      scheduled_prayers: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          group_id: string
          id: string
          is_recurring: boolean | null
          recurrence_type: string | null
          reminder_minutes: number | null
          scheduled_at: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          group_id: string
          id?: string
          is_recurring?: boolean | null
          recurrence_type?: string | null
          reminder_minutes?: number | null
          scheduled_at: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          group_id?: string
          id?: string
          is_recurring?: boolean | null
          recurrence_type?: string | null
          reminder_minutes?: number | null
          scheduled_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
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
        Relationships: []
      }
      shared_reading_badges: {
        Row: {
          badge_icon: string
          badge_name: string
          badge_type: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_icon: string
          badge_name: string
          badge_type: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_icon?: string
          badge_name?: string
          badge_type?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      shared_reading_participants: {
        Row: {
          finished_reading: boolean
          id: string
          is_host: boolean
          joined_at: string
          room_id: string
          total_points: number
          user_id: string
        }
        Insert: {
          finished_reading?: boolean
          id?: string
          is_host?: boolean
          joined_at?: string
          room_id: string
          total_points?: number
          user_id: string
        }
        Update: {
          finished_reading?: boolean
          id?: string
          is_host?: boolean
          joined_at?: string
          room_id?: string
          total_points?: number
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
        ]
      }
      shared_reading_quiz_answers: {
        Row: {
          answered_at: string
          chapter: number
          id: string
          is_correct: boolean
          question_index: number
          room_id: string
          selected_answer: string
          user_id: string
        }
        Insert: {
          answered_at?: string
          chapter: number
          id?: string
          is_correct?: boolean
          question_index: number
          room_id: string
          selected_answer: string
          user_id: string
        }
        Update: {
          answered_at?: string
          chapter?: number
          id?: string
          is_correct?: boolean
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
        ]
      }
      shared_reading_reactions: {
        Row: {
          created_at: string
          id: string
          reaction: string
          room_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reaction: string
          room_id: string
          user_id: string
        }
        Update: {
          created_at?: string
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
        ]
      }
      shared_reading_rooms: {
        Row: {
          created_at: string
          current_book_abbrev: string
          current_chapter: number
          host_id: string
          id: string
          is_public: boolean
          max_participants: number
          quiz_questions: Json | null
          room_code: string
          room_name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_book_abbrev?: string
          current_chapter?: number
          host_id: string
          id?: string
          is_public?: boolean
          max_participants?: number
          quiz_questions?: Json | null
          room_code: string
          room_name: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_book_abbrev?: string
          current_chapter?: number
          host_id?: string
          id?: string
          is_public?: boolean
          max_participants?: number
          quiz_questions?: Json | null
          room_code?: string
          room_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      shared_reading_stats: {
        Row: {
          current_streak: number
          longest_streak: number
          sessions_hosted: number
          total_chapters_completed: number
          total_correct_answers: number
          total_sessions: number
          total_wrong_answers: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          longest_streak?: number
          sessions_hosted?: number
          total_chapters_completed?: number
          total_correct_answers?: number
          total_sessions?: number
          total_wrong_answers?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak?: number
          longest_streak?: number
          sessions_hosted?: number
          total_chapters_completed?: number
          total_correct_answers?: number
          total_sessions?: number
          total_wrong_answers?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      spiritual_campaigns: {
        Row: {
          campaign_type: string
          completed_at: string | null
          created_at: string
          current_day: number
          duration_days: number
          id: string
          is_active: boolean
          started_at: string
          user_id: string
        }
        Insert: {
          campaign_type: string
          completed_at?: string | null
          created_at?: string
          current_day?: number
          duration_days?: number
          id?: string
          is_active?: boolean
          started_at?: string
          user_id: string
        }
        Update: {
          campaign_type?: string
          completed_at?: string | null
          created_at?: string
          current_day?: number
          duration_days?: number
          id?: string
          is_active?: boolean
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      testimonies: {
        Row: {
          audio_url: string | null
          content: string
          created_at: string
          glory_count: number
          id: string
          image_url: string | null
          likes_count: number
          title: string
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          audio_url?: string | null
          content: string
          created_at?: string
          glory_count?: number
          id?: string
          image_url?: string | null
          likes_count?: number
          title: string
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          audio_url?: string | null
          content?: string
          created_at?: string
          glory_count?: number
          id?: string
          image_url?: string | null
          likes_count?: number
          title?: string
          updated_at?: string
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
          created_at: string
          id: string
          testimony_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          testimony_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
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
        ]
      }
      testimony_glories: {
        Row: {
          created_at: string
          id: string
          testimony_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          testimony_id: string
          user_id: string
        }
        Update: {
          created_at?: string
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
          created_at: string
          id: string
          testimony_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          testimony_id: string
          user_id: string
        }
        Update: {
          created_at?: string
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
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
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
        ]
      }
      user_activities: {
        Row: {
          activity_date: string
          activity_type: string
          created_at: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          activity_date?: string
          activity_type: string
          created_at?: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          activity_date?: string
          activity_type?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_color: string
          badge_icon: string
          badge_name: string
          badge_type: string
          display_order: number | null
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_color: string
          badge_icon: string
          badge_name: string
          badge_type: string
          display_order?: number | null
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_color?: string
          badge_icon?: string
          badge_name?: string
          badge_type?: string
          display_order?: number | null
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_challenges: {
        Row: {
          challenge_id: string
          completed_at: string | null
          current_progress: number
          id: string
          is_completed: boolean
          started_at: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          current_progress?: number
          id?: string
          is_completed?: boolean
          started_at?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          current_progress?: number
          id?: string
          is_completed?: boolean
          started_at?: string
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
      user_reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          reason: string
          reported_user_id: string
          reporter_id: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reported_user_id: string
          reporter_id: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reported_user_id?: string
          reporter_id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          bible_chapters_read: number
          current_streak: number
          events_participated: number
          last_activity_date: string | null
          level: number
          longest_streak: number
          prayers_created: number
          prayers_interceded: number
          testimonies_shared: number
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          bible_chapters_read?: number
          current_streak?: number
          events_participated?: number
          last_activity_date?: string | null
          level?: number
          longest_streak?: number
          prayers_created?: number
          prayers_interceded?: number
          testimonies_shared?: number
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          bible_chapters_read?: number
          current_streak?: number
          events_participated?: number
          last_activity_date?: string | null
          level?: number
          longest_streak?: number
          prayers_created?: number
          prayers_interceded?: number
          testimonies_shared?: number
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_videos: {
        Row: {
          created_at: string
          description: string | null
          duration_seconds: number | null
          id: string
          likes_count: number
          location: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
          video_url: string
          views_count: number
          visibility: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          likes_count?: number
          location?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          user_id: string
          video_url: string
          views_count?: number
          visibility?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          likes_count?: number
          location?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          video_url?: string
          views_count?: number
          visibility?: string
        }
        Relationships: []
      }
      verse_comments: {
        Row: {
          book_abbrev: string
          book_name: string
          chapter: number
          comment_text: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
          verse_number: number
          verse_text: string
        }
        Insert: {
          book_abbrev: string
          book_name: string
          chapter: number
          comment_text: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          verse_number: number
          verse_text: string
        }
        Update: {
          book_abbrev?: string
          book_name?: string
          chapter?: number
          comment_text?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          verse_number?: number
          verse_text?: string
        }
        Relationships: []
      }
      verse_shares: {
        Row: {
          book_abbrev: string
          book_name: string
          chapter: number
          created_at: string
          id: string
          image_url: string | null
          share_channel: string
          user_id: string
          verse_number: number
        }
        Insert: {
          book_abbrev: string
          book_name: string
          chapter: number
          created_at?: string
          id?: string
          image_url?: string | null
          share_channel?: string
          user_id: string
          verse_number: number
        }
        Update: {
          book_abbrev?: string
          book_name?: string
          chapter?: number
          created_at?: string
          id?: string
          image_url?: string | null
          share_channel?: string
          user_id?: string
          verse_number?: number
        }
        Relationships: []
      }
      versiculos: {
        Row: {
          capitulo: number
          criado_em: string
          id: string
          idioma: string
          livro: string
          texto_final: string
          texto_original: string
          versiculo: number
        }
        Insert: {
          capitulo: number
          criado_em?: string
          id?: string
          idioma?: string
          livro: string
          texto_final: string
          texto_original: string
          versiculo: number
        }
        Update: {
          capitulo?: number
          criado_em?: string
          id?: string
          idioma?: string
          livro?: string
          texto_final?: string
          texto_original?: string
          versiculo?: number
        }
        Relationships: []
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
            foreignKeyName: "video_likes_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "user_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      worship_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worship_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "worship_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      worship_likes: {
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
            foreignKeyName: "worship_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "worship_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      worship_posts: {
        Row: {
          category: string | null
          comments_count: number | null
          created_at: string | null
          description: string | null
          id: string
          likes_count: number | null
          media_type: string | null
          media_url: string | null
          original_artist: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          comments_count?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          likes_count?: number | null
          media_type?: string | null
          media_url?: string | null
          original_artist?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          comments_count?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          likes_count?: number | null
          media_type?: string | null
          media_url?: string | null
          original_artist?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_level: { Args: { points: number }; Returns: number }
      can_view_community_reaction: {
        Args: {
          p_comment_id: string
          p_evaluation_id: string
          p_voting_id: string
        }
        Returns: boolean
      }
      can_view_photo: { Args: { p_photo_id: string }; Returns: boolean }
      can_view_video: {
        Args: { video_row: Database["public"]["Tables"]["user_videos"]["Row"] }
        Returns: boolean
      }
      generate_room_code: { Args: never; Returns: string }
      increment_chapters_completed: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      increment_sessions_hosted: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      is_blocked: { Args: { user_a: string; user_b: string }; Returns: boolean }
      is_chat_room_member: {
        Args: { p_room_id: string; p_user_id: string }
        Returns: boolean
      }
      is_friend_with: {
        Args: { p_other_user_id: string; p_user_id: string }
        Returns: boolean
      }
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
