# Humanoid Horizons Webgame - AI Coding Prompts

Gebruik deze prompts in Codex, ChatGPT, Claude, Cursor of Windsurf. Werk **altijd stap voor stap**. Laat de AI geen 100 bestanden tegelijk genereren. Vraag steeds eerst om een plan en daarna per feature om code.

---

## Prompt 1 - Basis project scaffold
```text
Je bent een senior full-stack developer. Maak een SvelteKit + TypeScript project voor een online multiplayer webgame genaamd Humanoid Horizons.

Stack:
- SvelteKit
- TypeScript
- Cloudflare adapter
- Cloudflare D1 als database
- Drizzle ORM
- Cloudflare Durable Objects voor realtime game rooms
- gewone CSS

Architectuurregels:
- scheid game engine, database, multiplayer en UI
- gebruik duidelijke types
- maak code eenvoudig en uitlegbaar
- voeg comments toe op belangrijke plaatsen

Maak eerst:
- bestandsstructuur
- package dependencies
- mapstructuur
- lege pagina’s en API routes

Routes:
- /
- /login
- /lobby
- /leaderboard
- /game/[gameId]

API:
- /api/me
- /api/games
- /api/leaderboard

Geef eerst de bestandsstructuur en wacht daarna op akkoord voor code per bestand.
```

---

## Prompt 2 - Database schema
```text
Maak het Drizzle ORM schema voor Cloudflare D1 voor Humanoid Horizons.

Maak tabellen voor:
- users
- user_stats
- games
- game_players
- game_snapshots
- game_events
- humanoid_cards
- suppliers
- job_cards
- leaderboard_history

Belangrijke regels:
- users heeft auth0_user_id als unieke externe identity key
- een speler kan maar 1 actieve game tegelijk hebben
- meerdere games kunnen tegelijk lopen
- elke game heeft max_players
- scoremodel moet mastery, wins, fit en compliance ondersteunen

Geef:
1. schema.ts
2. uitleg per tabel
3. indexen
4. eventuele constraints die in code moeten worden afgedwongen
```

---

## Prompt 3 - Auth0 integratie in frontend
```text
Integreer Auth0 in een SvelteKit frontend voor Humanoid Horizons.

Doel:
- login via Auth0 Universal Login
- logout
- access token ophalen
- ingelogde gebruiker in de UI tonen
- protected routes maken voor /lobby en /game/[gameId]

Gebruik:
- @auth0/auth0-spa-js
- environment variables

Maak:
- src/lib/auth/auth0.ts
- auth store
- login page
- logout action
- helper om access token op te halen
- protected route guard patroon voor SvelteKit

Geef code per bestand en leg kort uit hoe het werkt.
```

---

## Prompt 4 - Auth0 token validatie in backend
```text
Maak backend code voor een SvelteKit app op Cloudflare Workers die Auth0 access tokens valideert.

Doel:
- bearer token uit Authorization header lezen
- JWT valideren met Auth0 JWKS
- audience en issuer controleren
- sub, email, name en picture uit claims halen
- gebruiker upserten in D1

Gebruik:
- jose library
- environment variables AUTH0_DOMAIN en AUTH0_AUDIENCE

Maak:
- src/lib/auth/token-verify.ts
- src/lib/auth/require-user.ts
- POST /api/me/sync
- GET /api/me

Geef code per bestand.
```

---

## Prompt 5 - Eén actieve game per speler
```text
Implementeer serverlogica zodat een speler maar in 1 actieve game tegelijk kan zitten.

Regels:
- actieve game statuses zijn: waiting, active
- afgelopen statuses zijn: finished, abandoned, cancelled
- als speler al in een actieve game zit en probeert een nieuwe game te joinen, geef een duidelijke foutmelding
- als speler reconnect, stuur hem terug naar zijn bestaande game

Maak:
- service functie findActiveGameForUser
- service functie assertUserNotInAnotherActiveGame
- API routes voor create game, join game, leave game

Gebruik TypeScript en Drizzle.
```

---

## Prompt 6 - Multiplayer room met Durable Object
```text
Maak een Cloudflare Durable Object voor een realtime multiplayer game room.

Doel:
- 1 durable object per game room
- spelers verbinden via WebSocket
- room bewaart live state in memory
- room broadcast updates naar alle connected players
- room schrijft snapshots en events weg naar D1

Maak:
- workers/game-room-do.ts
- message protocol types
- join / reconnect flow
- heartbeat / disconnect handling

Belangrijke regels:
- gebruik een short-lived gameJoinToken in plaats van direct Auth0 token in de websocket handshake
- room moet speler-id, game-id en seat index kennen
- room valideert turn-based actions
```

---

## Prompt 7 - Game join token
```text
Maak een veilige gameJoinToken flow voor Humanoid Horizons.

Doel:
- na backend validatie van Auth0 en game membership krijgt de speler een short-lived signed token
- token bevat userId, gameId, playerId, seatIndex en exp
- durable object valideert dit token bij websocket connectie

Maak:
- src/lib/auth/game-join-token.ts
- signGameJoinToken()
- verifyGameJoinToken()
- POST /api/games/[id]/join

Gebruik een HMAC secret uit environment variables.
```

---

## Prompt 8 - Leaderboard en mastery score
```text
Maak een leaderboard systeem voor Humanoid Horizons dat niet alleen wins telt, maar vooral beloont wie humanoids het best begrijpt.

Maak een scoremodel met:
- mastery_rating
- wins
- games_played
- avg_job_fit_score
- avg_compliance_score
- avg_efficiency_score

Regels:
- start mastery_rating op 1000
- na elke ranked game bereken een game_mastery_score van 0 tot 100
- game_mastery_score is opgebouwd uit:
  - placement / resultaat
  - job-humanoid fit
  - compliance
  - efficiency
  - reliability
- update mastery_rating op basis van game_mastery_score, niet enkel op winst
- maak anti-grind logica zodat puur veel spelen niet automatisch hoogste rank geeft

Maak:
- scoring functions
- stats update service
- GET /api/leaderboard
- voorbeeld response JSON
```

---

## Prompt 9 - Three.js board scene
```text
Voeg een stylized 3D board scene toe aan de SvelteKit game pagina.

Doel:
- een Three.js scene tonen in /game/[gameId]
- orthographic camera gebruiken
- simpele stylized district / board environment tonen
- placeholder 3D objecten gebruiken voor humanoids, jobs en gebouwen
- klikbare objecten ondersteunen

Maak:
- GameBoard3D.svelte
- BoardScene.ts
- camera.ts
- lighting.ts
- raycast interaction helper

Visuele richting:
- kleurrijk
- speels
- low-poly
- niet fotorealistisch
- alsof het een miniatuurstad / bordspel is

Gebruik eerst primitive placeholders als assets nog ontbreken.
```

---

## Prompt 10 - 3D asset loading met GLB
```text
Breid de Three.js scene uit zodat GLB assets geladen kunnen worden.

Doel:
- asset manifest opzetten
- GLB models laden met GLTFLoader
- eenvoudige caching gebruiken
- placeholders fallbacken als asset niet laadt

Maak:
- asset-manifest.ts
- gltf-loader.ts
- voorbeeld assets voor humanoid, building, tree en job marker

Leg uit waar de GLB bestanden in het project moeten komen.
```

---

## Prompt 11 - Game state koppelen aan 3D scene
```text
Koppel de live game state aan de Three.js scene.

Doel:
- game state bevat spelers, humanoids, jobs en geselecteerde objecten
- bij state updates moeten objecten op de juiste positie staan
- hover/select feedback tonen
- eenvoudige beweging van humanoid pion van tile naar tile animeren

Maak:
- state-to-scene mapping functies
- simple tween animation helper
- selection highlight
- UI event callbacks naar de Svelte pagina
```

---

## Prompt 12 - Auth0 configuratie checklist generator
```text
Genereer een checklist in markdown voor de Auth0 configuratie van Humanoid Horizons.

De checklist moet bevatten:
- tenant aanmaken
- app aanmaken
- API aanmaken
- callback URLs
- logout URLs
- allowed web origins
- environment variables voor lokaal en productie
- testflow voor signup, login, logout en protected API call

Schrijf de checklist zodat iemand zonder Auth0 ervaring deze stap voor stap kan volgen.
```

---

## Prompt 13 - E2E testplan
```text
Maak een E2E testplan voor Humanoid Horizons.

Flows:
- nieuwe gebruiker signup/login via Auth0
- /api/me/sync
- nieuwe game maken
- tweede speler joint
- speler kan niet in tweede actieve game joinen
- game starten
- speler reconnect na refresh
- game eindigt
- leaderboard update

Maak test cases, verwachte resultaten en welke delen geautomatiseerd kunnen worden.
```

---

## Prompt 14 - Refactor prompt
```text
Refactor de bestaande codebase van Humanoid Horizons.

Doel:
- scheid pure domain logic van framework code
- verbeter type safety
- verwijder duplicatie
- voeg duidelijke interfaces toe
- verbeter foutmeldingen
- houd compatibiliteit met Cloudflare Workers

Geef eerst een analyse van de huidige structuur, daarna een voorgestelde refactor, en pas daarna de code.
```
