select
  cron.schedule(
    'invoke-scraper-every-5-minute',
    '*/5 * * * *',
    $$
    select
      net.http_post(
          url:='https://qqyodrnvbmprqnfciacv.supabase.co/functions/v1/scrape-tracked-searches',
          headers:=jsonb_build_object('Content-Type','application/json', 'Authorization', 'Bearer API_KEY_PUBLIC'),
          timeout_milliseconds:=5000
      ) as request_id;
    $$
  );