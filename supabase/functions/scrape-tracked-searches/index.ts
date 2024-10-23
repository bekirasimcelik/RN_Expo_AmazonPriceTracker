import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization')!;
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );

  // get all tracked searches
  const { data: searches, error } = await supabase.from('searches').select('*').eq('is_tracked', true);

  console.log(error);
  console.log(searches.length);

  return new Response(
    JSON.stringify({ ok: "ok" }),
    { headers: { "Content-Type": "application/json" } },
  )
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/scrape-start' \
    --header 'Authorization: Bearer api_key_public' \
    --header 'Content-Type: application/json' \
    --data '{"record": {"id": 1, "query": "iPhone"}}'


    
  curl -i --location --request POST 'https://qqyodrnvbmprqnfciacv.supabase.co/functions/v1/scrape-tracked-searches' \
    --header 'Authorization: Bearer api_key_public' \
    --header 'Content-Type: application/json'

*/
