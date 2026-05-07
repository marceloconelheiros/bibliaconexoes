import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Utilitário: mapeamento de capítulos por livro (order_index: chapters_count)
const BOOK_CHAPTERS = [
  50,40,27,36,34,24,21,4,31,24,22,25,29,36,10,13,10,42,150,31,12,8,66,52,5,48,12,14,3,9,1,4,7,3,3,3,2,14,4,28,16,24,21,28,16,16,13,6,6,4,4,5,3,6,4,1,13,5,5,3,5,1,1,1,22
];

const TOTAL_CHAPTERS = BOOK_CHAPTERS.reduce((a,b)=>a+b,0); // 1189

function daysByMode(mode: string): number {
  const map: Record<string, number> = {
    ULTRA_15: 15,
    FAST_30: 30,
    BALANCED_90: 90,
    COMFY_180: 180,
    CLASSIC_365: 365
  };
  return map[mode] || 365;
}

// Gera lista sequencial [ {bookIndex, chapterNumber, isPsalm} ... ]
function buildSequentialList() {
  const list = [];
  for(let b=0; b<66; b++){
    const count = BOOK_CHAPTERS[b];
    for(let c=1; c<=count; c++){
      list.push({ bookIndex:b, chapter:c, isPsalm:(b===18) }); // Salmos = index 18 (0-based)
    }
  }
  return list;
}

function partition(arr: any[], size: number) {
  const out=[];
  for(let i=0; i<arr.length; i+=size) out.push(arr.slice(i,i+size));
  return out;
}

// Estilos de distribuição
function distribute(list: any[], days: number, style: string) {
  const perDay = Math.ceil(list.length / days);

  if(style==='SEQUENTIAL'){
    return partition(list, perDay);
  }

  if(style==='MIX_ON'){
    const ot = list.filter((x: any)=>x.bookIndex<39);
    const nt = list.filter((x: any)=>x.bookIndex>=39);
    const buckets = Array.from({length:days}, ()=>[]);
    let i=0;
    while(ot.length || nt.length){
      const day: any = buckets[i % days];
      for(let k=0;k<Math.ceil(perDay*0.7) && ot.length;k++) day.push(ot.shift());
      for(let k=0;k<Math.floor(perDay*0.3) && nt.length;k++) day.push(nt.shift());
      i++;
    }
    return buckets.map((day: any) => day.slice(0,perDay));
  }

  if(style==='TRIAD'){
    const ot = list.filter((x: any)=>x.bookIndex<39 && !x.isPsalm);
    const nt = list.filter((x: any)=>x.bookIndex>=39);
    const sp = list.filter((x: any)=>x.isPsalm);
    const buckets = Array.from({length:days}, ()=>[]);
    for(let d=0; d<days; d++){
      const day: any = [];
      for(let k=0;k<Math.ceil(perDay/3)&&ot.length;k++) day.push(ot.shift());
      for(let k=0;k<Math.ceil(perDay/3)&&nt.length;k++) day.push(nt.shift());
      for(let k=0;k<Math.floor(perDay/3)&&sp.length;k++) day.push(sp.shift());
      while(day.length<perDay && (ot.length||nt.length||sp.length)){
        if(ot.length) day.push(ot.shift());
        else if(nt.length) day.push(nt.shift());
        else if(sp.length) day.push(sp.shift());
      }
      buckets[d]=day;
    }
    return buckets;
  }

  return partition(list, perDay);
}

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

    const { mode, style, start_date, title } = await req.json();
    
    const days_total = daysByMode(mode);
    const planTitle = title || `Plano ${mode.replace('_','-')} (${days_total} dias)`;
    const start = new Date(start_date);

    // 1) Criar plano
    const { data: plan, error: planError } = await supabaseClient
      .from('plans')
      .insert({
        user_id: user.id,
        title: planTitle,
        mode,
        style: style || 'SEQUENTIAL',
        start_date: start.toISOString().split('T')[0],
        days_total
      })
      .select()
      .single();

    if (planError) throw planError;

    // 2) Lista de capítulos
    const seq = buildSequentialList();

    // 3) Buscar chapters ordenados
    const { data: chapters, error: chaptersError } = await supabaseClient
      .from('chapters')
      .select(`
        id,
        chapter_number,
        books!inner(order_index)
      `)
      .order('books(order_index)', { ascending: true })
      .order('chapter_number', { ascending: true });

    if (chaptersError) throw chaptersError;

    // Criar índice de IDs
    const flatIds: string[][] = Array.from({length: 66}, () => []);
    for (const ch of chapters) {
      const bookIdx = (ch.books as any).order_index - 1;
      flatIds[bookIdx].push(ch.id);
    }

    const seqWithIds = seq.map((x: any) => ({
      ...x,
      chapter_id: flatIds[x.bookIndex][x.chapter-1]
    }));

    // 4) Distribuir por dia
    const buckets = distribute(seqWithIds, days_total, style || 'SEQUENTIAL');

    // 5) Persistir plan_days e plan_day_chapters
    for(let d=0; d<buckets.length; d++){
      const date = new Date(start);
      date.setDate(start.getDate()+d);
      
      const { data: plan_day, error: dayError } = await supabaseClient
        .from('plan_days')
        .insert({
          plan_id: plan.id,
          day_number: d+1,
          date: date.toISOString().split('T')[0]
        })
        .select()
        .single();

      if (dayError) throw dayError;

      const dayChapters = buckets[d].map((chap: any, idx: number) => ({
        plan_day_id: plan_day.id,
        chapter_id: chap.chapter_id,
        sort_order: idx + 1
      }));

      const { error: chaptersInsertError } = await supabaseClient
        .from('plan_day_chapters')
        .insert(dayChapters);

      if (chaptersInsertError) throw chaptersInsertError;
    }

    return new Response(
      JSON.stringify({ ok: true, plan_id: plan.id }),
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
