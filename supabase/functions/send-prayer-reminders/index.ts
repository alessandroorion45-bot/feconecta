import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Checking for upcoming scheduled prayers...');

    const now = new Date();
    
    // Find all scheduled prayers coming up
    const { data: upcomingPrayers, error: prayersError } = await supabase
      .from('scheduled_prayers')
      .select(`
        id,
        title,
        scheduled_at,
        reminder_minutes,
        group_id
      `)
      .gte('scheduled_at', now.toISOString());

    if (prayersError) {
      console.error('Error fetching prayers:', prayersError);
      throw prayersError;
    }

    console.log(`Found ${upcomingPrayers?.length || 0} upcoming prayers`);

    let notificationsSent = 0;

    for (const prayer of upcomingPrayers || []) {
      const scheduledTime = new Date(prayer.scheduled_at);
      const reminderMinutes = prayer.reminder_minutes || 15;
      const reminderTime = new Date(scheduledTime.getTime() - reminderMinutes * 60 * 1000);
      
      // Check if we're within the reminder window (now is past reminder time but before scheduled time)
      if (now >= reminderTime && now < scheduledTime) {
        console.log(`Processing reminder for prayer: ${prayer.title}`);
        
        // Get group name
        const { data: groupData } = await supabase
          .from('prayer_groups')
          .select('name')
          .eq('id', prayer.group_id)
          .single();
        
        const groupName = groupData?.name || 'Grupo de Oração';
        
        // Get attendees who haven't been notified yet
        const { data: attendees, error: attendeesError } = await supabase
          .from('scheduled_prayer_attendees')
          .select('user_id')
          .eq('scheduled_prayer_id', prayer.id)
          .eq('notified', false);

        if (attendeesError) {
          console.error('Error fetching attendees:', attendeesError);
          continue;
        }

        console.log(`Found ${attendees?.length || 0} unnotified attendees for prayer ${prayer.id}`);

        for (const attendee of attendees || []) {
          const minutesUntil = Math.round((scheduledTime.getTime() - now.getTime()) / 60000);
          
          // Get user's push subscriptions
          const { data: subscriptions } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', attendee.user_id);

          if (subscriptions && subscriptions.length > 0) {
            // Create notification payload
            const notificationPayload = {
              title: `🙏 Oração em ${minutesUntil} minutos`,
              body: `${prayer.title} - ${groupName}`,
              icon: '/favicon.ico',
              tag: `prayer-${prayer.id}`,
              data: { 
                url: '/prayers',
                type: 'scheduled_prayer',
                prayerId: prayer.id
              }
            };

            // Call the send-push-notification function for each user
            try {
              await supabase.functions.invoke('send-push-notification', {
                body: {
                  user_id: attendee.user_id,
                  ...notificationPayload
                }
              });
              notificationsSent++;
              console.log(`Sent push notification to user ${attendee.user_id}`);
            } catch (pushError) {
              console.error('Error sending push:', pushError);
            }
          }

          // Also create an in-app notification
          await supabase
            .from('notifications')
            .insert({
              user_id: attendee.user_id,
              type: 'prayer_reminder',
              content: `Oração agendada em ${minutesUntil} minutos: "${prayer.title}" (${groupName}) 🙏`,
              reference_id: prayer.id
            });

          // Mark attendee as notified
          await supabase
            .from('scheduled_prayer_attendees')
            .update({ notified: true })
            .eq('scheduled_prayer_id', prayer.id)
            .eq('user_id', attendee.user_id);
        }
      }
    }

    console.log(`Total notifications sent: ${notificationsSent}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${upcomingPrayers?.length || 0} prayers, sent ${notificationsSent} notifications` 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-prayer-reminders:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
