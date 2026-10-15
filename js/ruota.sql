-- ===== RUOTA DELLA FORTUNA =====
-- Da eseguire UNA volta nel SQL Editor di Supabase.
-- 1 giro ogni 7 giorni per squadra. Premio in tifosi, aggiunto direttamente alla squadra.
-- L'estrazione e il controllo del tempo li fa il database (non il browser): non si può barare.
-- Per cambiare i premi modifica solo la funzione ruota_premi() (8 valori, in senso orario dall'alto).

create table if not exists ruota_giri (
  id         bigint generated always as identity primary key,
  squadra_id text        not null,
  spicchio   int         not null,            -- da 1 a 8
  premio     int         not null,            -- tifosi vinti
  girato_il  timestamptz not null default now()
);
create index if not exists ruota_giri_squadra_idx on ruota_giri (squadra_id, girato_il desc);
alter table ruota_giri enable row level security; -- nessuna policy: si usa solo tramite le due funzioni qui sotto

create or replace function ruota_premi() returns int[]
language sql immutable as $$ select array[80, 50, 60, 100, 20, 40, 200, 1] $$;

-- Stato della ruota per una squadra: premi, ultimo giro, prossimo giro e ora del server (serve al timer)
create or replace function ruota_stato(p_squadra text) returns json
language plpgsql security definer set search_path = public as $$
declare
  v_ultimo timestamptz;
begin
  select max(girato_il) into v_ultimo from ruota_giri where squadra_id = p_squadra;
  return json_build_object(
    'ora',      now(),
    'ultimo',   v_ultimo,
    'prossimo', case when v_ultimo is null then null else v_ultimo + interval '7 days' end,
    'premi',    to_json(ruota_premi()),
    'storico',  coalesce((select json_agg(x) from (
                   select premio, girato_il from ruota_giri
                   where squadra_id = p_squadra order by girato_il desc limit 5) x), '[]'::json)
  );
end $$;

-- Gira la ruota: controlla i 7 giorni, estrae, registra e aggiunge i tifosi, tutto in un colpo solo
create or replace function ruota_gira(p_squadra text) returns json
language plpgsql security definer set search_path = public as $$
declare
  v_premi  int[] := ruota_premi();
  v_ultimo timestamptz;
  v_idx    int;
  v_premio int;
begin
  -- blocca la riga della squadra: due giri contemporanei vengono messi in fila
  perform 1 from squadre where id::text = p_squadra for update;
  if not found then
    raise exception 'Squadra non trovata';
  end if;

  select max(girato_il) into v_ultimo from ruota_giri where squadra_id = p_squadra;
  if v_ultimo is not null and now() < v_ultimo + interval '7 days' then
    raise exception 'TROPPO_PRESTO:%', extract(epoch from (v_ultimo + interval '7 days' - now()))::bigint;
  end if;

  v_idx    := 1 + floor(random() * array_length(v_premi, 1))::int;
  v_premio := v_premi[v_idx];

  insert into ruota_giri (squadra_id, spicchio, premio) values (p_squadra, v_idx, v_premio);
  update squadre set tifosi = coalesce(tifosi, 0) + v_premio where id::text = p_squadra;

  return json_build_object('spicchio', v_idx, 'premio', v_premio,
                           'prossimo', now() + interval '7 days', 'ora', now());
end $$;

grant execute on function ruota_stato(text) to anon, authenticated;
grant execute on function ruota_gira(text)  to anon, authenticated;

-- Per provare: azzera il giro di UNA squadra (sostituisci l'id)
-- delete from ruota_giri where squadra_id = 'ID_SQUADRA';
