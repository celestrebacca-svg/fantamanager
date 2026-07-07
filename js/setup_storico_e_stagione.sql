-- Tabella per lo storico carriera dei giocatori (Fantamanager Gold)
-- Esegui questo script nell'SQL Editor di Supabase

create table if not exists storico_giocatore (
  id bigint generated always as identity primary key,
  giocatore_id bigint not null references giocatori(id) on delete cascade,
  stagione text not null,
  evento text not null, -- trasferimento | prestito | rientro_prestito | riscatto | scambio | svincolo | modifica_admin
  squadra_da text,
  squadra_a text,
  numero_maglia integer,
  tipo_contratto text,
  importo numeric,
  note text,
  created_at timestamptz default now()
);

create index if not exists idx_storico_giocatore_giocatore_id on storico_giocatore(giocatore_id);

-- Tabella impostazioni: riga unica con la stagione corrente, condivisa da
-- bilancio, competizioni, risiko e storico giocatori (STAGIONE_CORRENTE).
create table if not exists impostazioni (
  id int primary key default 1,
  stagione_corrente text not null default '2025/26'
);
insert into impostazioni (id, stagione_corrente) values (1, '2025/26')
  on conflict (id) do nothing;

-- Nessuna RLS abilitata, coerente col resto del progetto (sicurezza gestita
-- lato client tramite adminLoggato).
