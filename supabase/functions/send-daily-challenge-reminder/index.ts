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

    console.log('Starting daily challenge reminder job...');

    const today = new Date().toISOString().split('T')[0];

    // Get today's challenge
    const { data: todayChallenge, error: challengeError } = await supabase
      .from('daily_biblical_challenges')
      .select('*')
      .eq('challenge_date', today)
      .single();

    if (challengeError || !todayChallenge) {
      console.log('No challenge found for today:', today);
      return new Response(
        JSON.stringify({ message: 'No challenge for today', sent: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Today\'s challenge:', todayChallenge.challenge_text);

    // Get all users with push subscriptions who haven't completed today's challenge
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('user_id, endpoint, p256dh, auth');

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No push subscriptions found');
      return new Response(
        JSON.stringify({ message: 'No subscriptions', sent: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get users who already completed today's challenge
    const { data: completions, error: completionError } = await supabase
      .from('daily_challenge_completions')
      .select('user_id')
      .eq('challenge_id', todayChallenge.id);

    const completedUserIds = new Set((completions || []).map(c => c.user_id));

    // Filter out users who already completed
    const usersToNotify = subscriptions.filter(sub => !completedUserIds.has(sub.user_id));

    console.log(`Users to notify: ${usersToNotify.length} (${completedUserIds.size} already completed)`);

    // Group subscriptions by user (in case user has multiple devices)
    const userSubscriptions = new Map<string, typeof subscriptions>();
    usersToNotify.forEach(sub => {
      if (!userSubscriptions.has(sub.user_id)) {
        userSubscriptions.set(sub.user_id, []);
      }
      userSubscriptions.get(sub.user_id)!.push(sub);
    });

    // Prepare notification payload
    const notificationPayload = {
      title: '📖 Desafio Bíblico do Dia',
      body: todayChallenge.challenge_text,
      icon: '/favicon.ico',
      tag: 'daily-challenge',
      data: {
        url: '/challenges',
        challengeId: todayChallenge.id
      }
    };

    let sentCount = 0;
    const errors: string[] = [];

    // Send notifications (simulated for now - in production use web-push library)
    for (const [userId, subs] of userSubscriptions) {
      try {
        console.log(`Preparing notification for user ${userId} (${subs.length} devices)`);
        
        // In production, you would actually send the push notification here
        // using the web-push library or a service like Firebase Cloud Messaging
        
        // For now, we create an in-app notification as fallback
        await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            type: 'daily_challenge',
            content: `📖 Desafio do dia: ${todayChallenge.challenge_text}`,
            reference_id: todayChallenge.id
          });

        sentCount++;
      } catch (error) {
        console.error(`Error sending to user ${userId}:`, error);
        errors.push(`User ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`Daily challenge reminders sent: ${sentCount}/${userSubscriptions.size}`);

    return new Response(
      JSON.stringify({ 
        message: 'Daily challenge reminders processed',
        sent: sentCount,
        total: userSubscriptions.size,
        challenge: todayChallenge.challenge_text,
        errors: errors.length > 0 ? errors : undefined
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-daily-challenge-reminder:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
