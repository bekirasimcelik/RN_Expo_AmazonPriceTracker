// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import { createClient } from "jsr:@supabase/supabase-js@2";

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { supabase } from '../../../utils/supabase';

console.log('Hello from Functions!');

// curl
// -H "Authorization: Bearer d72e0fee-0699-4dc0-89d8-5ddd9b699a94"
// -H "Content-Type: application/json"
// -d '[{"keyword":"X-box","url":"https://www.amazon.com","pages_to_search":1}]'
// "https://api.brightdata.com/datasets/v3/trigger?dataset_id=gd_lwdb4vjm1ehb499uxs&limit_multiple_results=10"

const startScraping = async (keyword: string) => {
  const res = await fetch(
    'https://api.brightdata.com/datasets/v3/trigger?dataset_id=gd_lwdb4vjm1ehb499uxs&limit_multiple_results=10',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('BRIGHT_DATA_API_KEY')}`,
      },
      body: JSON.stringify([
        {
          keyword,
          url: 'https://www.amazon.com',
          pages_to_search: 1,
        },
      ]),
    }
  );

  const resJson = await res.json();
  return resJson;
};

Deno.serve(async (req) => {
  const { record } = await req.json();

  const newScrape = await startScraping(record.query);

  const authHeader = req.headers.get('Authorization')!;
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data, error } = await supabaseClient
    .from('searches')
    .update({ snapshot_id: newScrape.snapshot_id, status: 'Scraping' })
    .eq('id', record.id)
    .select()
    .single();

  return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/scrape-start' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"record": {"id": 1, "query": "Iphone"}}'

  curl -i --location --request POST 'https://uzbiwobbmoqctviwtymm.supabase.co/functions/v1/hello-world' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6Yml3b2JibW9xY3R2aXd0eW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg1ODE5ODMsImV4cCI6MjA0NDE1Nzk4M30.f4dyjEoSSroqhhI82R3Jh9nLlJQYnIiEFYcVGuKopfc' \
    --header 'Content-Type: application/json' \
    --data '{"record": {"id": 1, "query": "Iphone"}}'

*/
