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

    const { plan_id, chapter_id, checked } = await req.json();

    if (checked) {
      // Insert progress
      const { error } = await supabaseClient
        .from('progress')
        .insert({
          user_id: user.id,
          plan_id,
          chapter_id
        });

      if (error && error.code !== '23505') { // Ignore duplicate key error
        throw error;
      }
    } else {
      // Remove progress
      const { error } = await supabaseClient
        .from('progress')
        .delete()
        .eq('user_id', user.id)
        .eq('plan_id', plan_id)
        .eq('chapter_id', chapter_id);

      if (error) throw error;
    }

    return new Response(
      JSON.stringify({ ok: true }),
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
