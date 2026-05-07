import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { plan_id } = await req.json();

    // Get all plan days ordered by day_number
    const { data: planDays, error: daysError } = await supabaseClient
      .from('plan_days')
      .select('*')
      .eq('plan_id', plan_id)
      .order('day_number', { ascending: true });

    if (daysError) throw daysError;

    // For each day, check if it has incomplete chapters
    for (const day of planDays) {
      const { data: dayChapters, error: chaptersError } = await supabaseClient
        .from('plan_day_chapters')
        .select('chapter_id')
        .eq('plan_day_id', day.id);

      if (chaptersError) throw chaptersError;

      const chapterIds = dayChapters.map(dc => dc.chapter_id);

      // Check how many are completed
      const { data: completed, error: progressError } = await supabaseClient
        .from('progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('plan_id', plan_id)
        .in('chapter_id', chapterIds);

      if (progressError) throw progressError;

      // If not all chapters are completed, return this day
      if (completed.length < chapterIds.length) {
        return new Response(
          JSON.stringify({ next_day: day }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // All chapters completed
    return new Response(
      JSON.stringify({ next_day: null, completed: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
