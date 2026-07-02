/**
 * TYPE OVERRIDES PARA SUPABASE
 *
 * Este arquivo contém extensões de tipos para funções RPC e tabelas
 * que existem no banco mas não foram geradas automaticamente pelo CLI.
 *
 * Para regenerar os types base:
 * npx supabase gen types typescript --project-id <project-id> > src/integrations/supabase/types.ts
 */

import { Database } from './types';

// Estender os tipos do Database para incluir as funções RPC que faltam
export type ExtendedDatabase = Database & {
  public: Database['public'] & {
    Functions: Database['public']['Functions'] & {
      // Função de XP
      award_xp: {
        Args: {
          p_user_id: string;
          p_action_key: string;
          p_metadata?: Record<string, any> | null;
        };
        Returns: Array<{
          xp_earned: number;
          total_xp: number;
          new_level: number;
          new_title: string;
          level_up: boolean;
        }>;
      };

      // Multiplicador VIP
      get_xp_multiplier: {
        Args: {
          user_id: string;
        };
        Returns: number;
      };

      // Streak
      update_user_streak: {
        Args: {
          p_user_id: string;
        };
        Returns: Array<{
          current_streak: number;
          longest_streak: number;
          streak_increased: boolean;
          milestone_reached: string | null;
        }>;
      };

      // Desafios semanais
      get_weekly_challenges: {
        Args: {
          p_user_id?: string | null;
        };
        Returns: Array<{
          id: string;
          title: string;
          description: string;
          challenge_type: string;
          target_count: number;
          xp_reward: number;
          start_date: string;
          end_date: string;
          is_active: boolean;
          current_progress?: number;
          completed?: boolean;
        }>;
      };
    };

    Tables: Database['public']['Tables'] & {
      // Tabela user_stats (se não estiver nos types gerados)
      user_stats: {
        Row: {
          user_id: string;
          total_xp: number;
          level: number;
          title: string;
          current_streak: number;
          longest_streak: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          total_xp?: number;
          level?: number;
          title?: string;
          current_streak?: number;
          longest_streak?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          total_xp?: number;
          level?: number;
          title?: string;
          current_streak?: number;
          longest_streak?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // Tabela weekly_challenges
      weekly_challenges: {
        Row: {
          id: string;
          title: string;
          description: string;
          challenge_type: string;
          target_count: number;
          xp_reward: number;
          start_date: string;
          end_date: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          challenge_type: string;
          target_count: number;
          xp_reward: number;
          start_date: string;
          end_date: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          challenge_type?: string;
          target_count?: number;
          xp_reward?: number;
          start_date?: string;
          end_date?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };
  };
};

// Helper type para o cliente Supabase com tipos estendidos
export type SupabaseClientWithExtensions = ReturnType<typeof import('./client').supabase> & {
  rpc: {
    award_xp: (args: ExtendedDatabase['public']['Functions']['award_xp']['Args']) =>
      Promise<{ data: ExtendedDatabase['public']['Functions']['award_xp']['Returns'] | null; error: any }>;

    get_xp_multiplier: (args: ExtendedDatabase['public']['Functions']['get_xp_multiplier']['Args']) =>
      Promise<{ data: ExtendedDatabase['public']['Functions']['get_xp_multiplier']['Returns'] | null; error: any }>;

    update_user_streak: (args: ExtendedDatabase['public']['Functions']['update_user_streak']['Args']) =>
      Promise<{ data: ExtendedDatabase['public']['Functions']['update_user_streak']['Returns'] | null; error: any }>;

    get_weekly_challenges: (args?: ExtendedDatabase['public']['Functions']['get_weekly_challenges']['Args']) =>
      Promise<{ data: ExtendedDatabase['public']['Functions']['get_weekly_challenges']['Returns'] | null; error: any }>;
  };
};
