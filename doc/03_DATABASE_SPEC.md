# Humanoid Horizons Webgame - Database Specificatie

## Database
Gebruik Cloudflare D1. Dit voelt als SQLite en is eenvoudig genoeg voor een eerste MVP.

## Tabellen

### games
```sql
CREATE TABLE games (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  status TEXT NOT NULL,
  round INTEGER NOT NULL DEFAULT 1,
  cash INTEGER NOT NULL DEFAULT 100,
  reputation INTEGER NOT NULL DEFAULT 20,
  action_points INTEGER NOT NULL DEFAULT 2,
  successful_jobs INTEGER NOT NULL DEFAULT 0,
  failed_jobs INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### humanoid_cards
```sql
CREATE TABLE humanoid_cards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  generation TEXT NOT NULL,
  supplier_id TEXT,
  cost INTEGER NOT NULL,
  maintenance_cost INTEGER NOT NULL,
  reliability INTEGER NOT NULL,
  mobility INTEGER NOT NULL,
  dexterity INTEGER NOT NULL,
  social_skill INTEGER NOT NULL,
  payload INTEGER NOT NULL,
  energy INTEGER NOT NULL,
  available_from_round INTEGER NOT NULL DEFAULT 1,
  description TEXT NOT NULL
);
```

### player_humanoids
```sql
CREATE TABLE player_humanoids (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  humanoid_card_id TEXT NOT NULL,
  nickname TEXT,
  condition INTEGER NOT NULL DEFAULT 100,
  training_level INTEGER NOT NULL DEFAULT 0,
  is_available INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY(game_id) REFERENCES games(id),
  FOREIGN KEY(humanoid_card_id) REFERENCES humanoid_cards(id)
);
```

### suppliers
```sql
CREATE TABLE suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  continent TEXT NOT NULL,
  setup_cost INTEGER NOT NULL,
  discount_percent INTEGER NOT NULL DEFAULT 0,
  reliability_bonus INTEGER NOT NULL DEFAULT 0,
  compliance_penalty INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL
);
```

### player_suppliers
```sql
CREATE TABLE player_suppliers (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  supplier_id TEXT NOT NULL,
  relationship_level INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY(game_id) REFERENCES games(id),
  FOREIGN KEY(supplier_id) REFERENCES suppliers(id)
);
```

### job_cards
```sql
CREATE TABLE job_cards (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  sector TEXT NOT NULL,
  continent TEXT NOT NULL,
  reward INTEGER NOT NULL,
  reputation_reward INTEGER NOT NULL,
  risk INTEGER NOT NULL,
  required_mobility INTEGER NOT NULL DEFAULT 0,
  required_dexterity INTEGER NOT NULL DEFAULT 0,
  required_social_skill INTEGER NOT NULL DEFAULT 0,
  required_payload INTEGER NOT NULL DEFAULT 0,
  required_energy INTEGER NOT NULL DEFAULT 0,
  compliance_level INTEGER NOT NULL DEFAULT 1,
  description TEXT NOT NULL
);
```

### active_jobs
```sql
CREATE TABLE active_jobs (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  job_card_id TEXT NOT NULL,
  round INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  assigned_humanoid_id TEXT,
  FOREIGN KEY(game_id) REFERENCES games(id),
  FOREIGN KEY(job_card_id) REFERENCES job_cards(id)
);
```

### continent_status
```sql
CREATE TABLE continent_status (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  continent TEXT NOT NULL,
  compliance_score INTEGER NOT NULL DEFAULT 50,
  market_demand INTEGER NOT NULL DEFAULT 50,
  wage_pressure INTEGER NOT NULL DEFAULT 50,
  supplier_access INTEGER NOT NULL DEFAULT 50,
  compliance_failures INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY(game_id) REFERENCES games(id)
);
```

### game_events
```sql
CREATE TABLE game_events (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  round INTEGER NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  payload_json TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY(game_id) REFERENCES games(id)
);
```

## Seed data voorbeeld

### Humanoid card
```json
{
  "id": "hh-basic-worker-v1",
  "name": "Basic Worker H1",
  "generation": "Gen 1",
  "cost": 35,
  "maintenance_cost": 5,
  "reliability": 60,
  "mobility": 50,
  "dexterity": 40,
  "social_skill": 20,
  "payload": 60,
  "energy": 50,
  "available_from_round": 1,
  "description": "Betaalbare humanoid voor eenvoudige fysieke taken. Niet sterk in sociale opdrachten."
}
```

### Job card
```json
{
  "id": "facility-night-shift-eu",
  "title": "Nachtelijke schoonmaakshift",
  "sector": "Facility services",
  "continent": "Europa",
  "reward": 25,
  "reputation_reward": 4,
  "risk": 20,
  "required_mobility": 30,
  "required_dexterity": 30,
  "required_social_skill": 0,
  "required_payload": 20,
  "required_energy": 40,
  "compliance_level": 2,
  "description": "Een facility bedrijf zoekt hulp voor nachtelijke schoonmaak door personeelstekort en stijgende loonkosten."
}
```

## Dataregels
- Waarden lopen bij voorkeur van 0 tot 100
- Geldwaarden zijn abstracte punten, geen echte euro’s
- `payload_json` mag gebruikt worden voor extra details zonder nieuwe kolommen
- Nieuwe kaarten moeten via seed files toegevoegd kunnen worden

---

# Multiplayer, accounts en score uitbreiding

## Nieuwe tabellen

### users

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  auth_provider TEXT NOT NULL, -- auth0 of keycloak
  auth_provider_id TEXT NOT NULL UNIQUE,
  email TEXT,
  nickname TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'player',
  status TEXT NOT NULL DEFAULT 'active', -- active, blocked, deleted
  active_game_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### game_players

```sql
CREATE TABLE game_players (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  player_slot INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'joined', -- joined, active, disconnected, inactive, left, finished
  final_rank INTEGER,
  final_hus_score REAL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(game_id, user_id),
  UNIQUE(game_id, player_slot)
);
```

### game_results

```sql
CREATE TABLE game_results (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  won INTEGER NOT NULL DEFAULT 0,
  final_rank INTEGER NOT NULL,
  hus_score REAL NOT NULL,
  task_fit_score REAL NOT NULL,
  compliance_score REAL NOT NULL,
  efficiency_score REAL NOT NULL,
  supplier_strategy_score REAL NOT NULL,
  financial_score REAL NOT NULL,
  reputation_score REAL NOT NULL,
  adaptability_score REAL NOT NULL,
  win_bonus REAL NOT NULL,
  created_at TEXT NOT NULL
);
```

### leaderboard_snapshots

```sql
CREATE TABLE leaderboard_snapshots (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  leaderboard_type TEXT NOT NULL, -- overall, weekly, expert_task_fit, expert_compliance, expert_supplier
  score REAL NOT NULL,
  wins INTEGER NOT NULL,
  finished_games INTEGER NOT NULL,
  average_best_10_hus REAL NOT NULL,
  win_rate REAL NOT NULL,
  main_badge TEXT,
  calculated_at TEXT NOT NULL
);
```

### player_badges

```sql
CREATE TABLE player_badges (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  badge_code TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_level INTEGER NOT NULL DEFAULT 1,
  earned_at TEXT NOT NULL,
  UNIQUE(user_id, badge_code)
);
```

## Aanpassingen aan games table

Voeg velden toe:

```sql
ALTER TABLE games ADD COLUMN max_players INTEGER NOT NULL DEFAULT 4;
ALTER TABLE games ADD COLUMN current_player_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE games ADD COLUMN status TEXT NOT NULL DEFAULT 'waiting';
ALTER TABLE games ADD COLUMN winner_user_id TEXT;
ALTER TABLE games ADD COLUMN durable_object_id TEXT;
```

## Belangrijke constraints in applicatielogica

D1 ondersteunt niet alle complexe realtime locks zoals een klassieke serverdatabase. Daarom moeten deze regels ook in server-side code gevalideerd worden:

- user.active_game_id mag maar één actieve/wachtende game bevatten
- game.current_player_count mag nooit boven max_players gaan
- alleen actieve spelers in een game mogen acties doen
- score wordt alleen server-side berekend
- game_results wordt maar één keer per game/player aangemaakt

