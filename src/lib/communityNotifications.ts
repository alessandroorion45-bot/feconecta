import { supabase } from "@/integrations/supabase/client";

const sb = supabase as any;

/** Notifica todos os membros ativos da comunidade (exceto quem disparou a ação). */
export async function notifyCommunityMembers(
  communityId: string,
  actorId: string,
  type: string,
  content: string,
  referenceId?: string
) {
  try {
    const { data: members } = await supabase
      .from("church_community_members")
      .select("user_id")
      .eq("community_id", communityId)
      .eq("is_active", true);

    const recipients = [...new Set((members || []).map(m => m.user_id))].filter(id => id !== actorId);
    if (!recipients.length) return;

    const rows = recipients.map(user_id => ({
      user_id,
      actor_id: actorId,
      type,
      content,
      reference_id: referenceId || communityId,
    }));

    await sb.from("notifications").insert(rows);
  } catch {
    // Notificação é um "nice to have" — nunca deve travar a ação principal.
  }
}

/** Notifica só os membros ativos de uma célula específica (mantém o pedido de oração privado). */
export async function notifyCellMembers(
  cellId: string,
  actorId: string,
  type: string,
  content: string,
  referenceId?: string
) {
  try {
    const { data: members } = await sb
      .from("community_cell_members")
      .select("user_id")
      .eq("cell_id", cellId)
      .eq("is_active", true);

    const recipients = [...new Set((members || []).map((m: any) => m.user_id))].filter(id => id !== actorId);
    if (!recipients.length) return;

    const rows = recipients.map(user_id => ({
      user_id,
      actor_id: actorId,
      type,
      content,
      reference_id: referenceId || cellId,
    }));

    await sb.from("notifications").insert(rows);
  } catch {
    // idem
  }
}
