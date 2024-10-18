// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

console.log("Hello from Functions!")

// curl
// -H "Authorization: Bearer API_KEY"
// -H "Content-Type: application/json"
// -d '[{"keyword":"X-box","url":"https://www.amazon.com","pages_to_search":1}]'
// "https://api.brightdata.com/datasets/v3/trigger?dataset_id=gd_lwdb4vjm1ehb499uxs&limit_multiple_results=10"

const startScraping = async (keyword: string, search_id: string) => {
  const searchParams = new URLSearchParams({
    dataset_id: 'gd_lwdb4vjm1ehb499uxs',
    format: "json",
    uncompressed_webhook: "true",
    limit_multiple_results: '10',
    endpoint: `https://qqyodrnvbmprqnfciacv.supabase.co/functions/v1/scrape-complete?id=${search_id}`,
    auth_header: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`
  })
  const res = await fetch(
    `https://api.brightdata.com/datasets/v3/trigger?${searchParams.toString()}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get('BRIGHT_DATA_API_KEY')}`,
      },
      body: JSON.stringify([{ keyword: keyword, url: "https://www.amazon.com", pages_to_search: 1 }])
    }
  );

  const resJson = await res.json();
  return resJson;
};

Deno.serve(async (req) => {
  const { record } = await req.json();

  const newSCrape = await startScraping(record.query, record.id);

  const authHeader = req.headers.get('Authorization')!;
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data, error } = await supabaseClient.from("searches").update({ snapshot_id: newSCrape.snapshot_id, status: "Scraping" })
    .eq('id', record.id)
    .select()
    .single();

  return new Response(
    JSON.stringify(data),
    { headers: { "Content-Type": "application/json" } },
  )
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/scrape-start' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"record": {"id": 1, "query": "iPhone"}}'


    
  curl -i --location --request POST 'https://qqyodrnvbmprqnfciacv.supabase.co/functions/v1/scrape-start' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxeW9kcm52Ym1wcnFuZmNpYWN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkxNTcxMDEsImV4cCI6MjA0NDczMzEwMX0.cEeaDRroSwQQaY4w3Dfw2UZevCja-1yWxIDjJEffDa4' \
    --header 'Content-Type: application/json' \
    --data '{"record": {"id": 1, "query": "iPhone"}}'

endpoint=https://qqyodrnvbmprqnfciacv.supabase.co/functions/v1/scrape-complete&auth_header=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxeW9kcm52Ym1wcnFuZmNpYWN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTE1NzEwMSwiZXhwIjoyMDQ0NzMzMTAxfQ.V9NnokVRr99tFXdfmh6J9b3e09s-Wpe22ezTCSyHjsA

*/
