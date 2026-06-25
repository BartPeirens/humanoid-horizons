# Humanoid Horizons Webgame - Technische Specificatie

## 1. Aanbevolen stack

### Kernstack
- **Programmeertaal:** TypeScript
- **Framework:** SvelteKit
- **Hosting:** Cloudflare Pages
- **Backend:** SvelteKit server routes op Cloudflare Pages Functions / Workers
- **Database:** Cloudflare D1 (SQLite-achtig)
- **ORM:** Drizzle ORM
- **Authenticatie:** Auth0 voor MVP, later optioneel Keycloak
- **Realtime multiplayer:** Cloudflare Durable Objects + WebSockets
- **Permanente opslag:** D1

### Visual / render stack
Omdat je graag een toegankelijke **3D webgame** wilt in de sfeer van een stylized, kleurrijke, niet-fotorealistische city/board look:
- **3D engine in browser:** Three.js
- **Svelte integratie:** bij voorkeur gewone Three.js in een aparte Svelte component, of **Threlte** als je component-based 3D wilt
- **Model formaat:** glTF / GLB
- **3D tooling:** Blender voor eigen assets of eenvoudige low-poly kitbash assets voor prototype
- **Animaties:** eenvoudige loop animaties, tweened bewegingen, weinig complex rigging in MVP

## 2. Waarom deze keuze?

### Waarom SvelteKit?
- Frontend en backend zitten in één project
- Goedkoop en eenvoudig te deployen
- Goede DX voor Codex / AI-coding

### Waarom Cloudflare?
- Goedkope hosting
- D1 is eenvoudig voor een eerste versie
- Durable Objects zijn geschikt voor stateful multiplayer rooms

### Waarom Auth0?
- Geen zelfbouw login, password reset of email verification nodig
- Sneller MVP
- Minder security-risico dan zelf auth maken

### Waarom Three.js?
- Draait rechtstreeks in de browser
- Geschikt voor stylized 3D, isometric views en lichte webgames
- Past goed bij jouw gewenste look: "gezellig 3D diorama / boardgame world"

## 3. Architectuur overzicht

```text
Browser
  |
  |-- SvelteKit pages + UI
  |-- Three.js board renderer
  |
  v
SvelteKit server routes / Cloudflare Workers
  |
  |-- Auth token validation
  |-- Lobby endpoints
  |-- Leaderboard endpoints
  |-- Game management endpoints
  |
  |---------------------------> Cloudflare D1
  |
  |---------------------------> Durable Object per actieve game room
                                       |
                                       |-- WebSockets per speler
                                       |-- In-memory actieve turn state
                                       |-- Write-through persistence naar D1
```

## 4. Belangrijk ontwerpprincipe

Splits het project in **3 lagen**:

### Laag 1 - Game domain / regels
Pure TypeScript zonder UI.
Voorbeelden:
- beurtlogica
- validaties
- scoring
- turn transitions
- winner calculation

### Laag 2 - Multiplayer applicatielaag
Server routes + Durable Objects.
Voorbeelden:
- game room aanmaken
- speler laten joinen
- één actieve game per speler afdwingen
- realtime state broadcasten

### Laag 3 - Presentatie / visuals
Svelte + Three.js.
Voorbeelden:
- 3D board renderen
- karakters tonen
- tegels selecteren
- animaties bij moves

Deze scheiding is belangrijk omdat Codex dan veel betrouwbaarder code kan genereren.

## 5. Auth architectuur

## Aanbevolen auth-flow
Gebruik **Auth0 SPA flow met Authorization Code + PKCE**.

### Waarom niet zelf sessies bouwen als eerste stap?
Dat is extra werk. Voor dit project is het eenvoudiger om:
1. de gebruiker te laten inloggen via Auth0
2. een access token te verkrijgen in de frontend
3. dat token te sturen naar SvelteKit API routes
4. daar het token te verifiëren
5. de speler in de D1 `users` tabel te synchroniseren

### Belangrijke identity keys
Gebruik in de app:
- `auth0_user_id` = Auth0 `sub` claim, uniek en stabiel
- `email`
- `display_name`
- `avatar_url`

### Aanbevolen patroon voor multiplayer
Gebruik **niet** rechtstreeks het Auth0 token voor de WebSocket room als de enige room-auth.
Gebruik deze flow:

1. gebruiker logt in via Auth0
2. frontend roept `/api/me/sync` aan met Auth0 access token
3. backend valideert token en maakt/updatet lokale gebruiker in D1
4. frontend vraagt `/api/games/:id/join`
5. backend checkt of gebruiker al in een actieve game zit
6. backend maakt game-membership aan en geeft een **short-lived signed gameJoinToken** terug
7. frontend opent WebSocket naar Durable Object met die `gameJoinToken`
8. Durable Object accepteert de socket en koppelt hem aan de juiste speler

Dit is eenvoudiger en veiliger dan directe Auth0-validatie in elke WebSocket handshake.

## 6. Realtime multiplayer model

### Kernregels
- meerdere games kunnen tegelijk lopen
- elke game heeft een configureerbaar maximum aantal spelers
- elke speler kan maar in **1 actieve game tegelijk** zitten
- een game room is realtime
- spectators zijn optioneel en niet nodig voor MVP

### Durable Object verantwoordelijkheid
Elke actieve game room heeft één Durable Object dat:
- de live game state bewaart
- acties valideert
- de turn bewaakt
- updates broadcast naar alle spelers
- reconnects afhandelt
- snapshots opslaat in D1

## 7. Basisroutes

### Publieke routes
- `/` home
- `/how-to-play`
- `/leaderboard`
- `/login`
- `/logout`

### Authenticated routes
- `/lobby`
- `/profile`
- `/game/[gameId]`

### API routes
- `POST /api/me/sync`
- `GET /api/me`
- `GET /api/leaderboard`
- `POST /api/games`
- `GET /api/games/open`
- `POST /api/games/:id/join`
- `POST /api/games/:id/leave`
- `POST /api/games/:id/start`
- `POST /api/games/:id/action`
- `GET /api/games/:id/state`
- `GET /api/games/:id/history`

## 8. Voorstel projectstructuur

```text
src/
  lib/
    auth/
      auth0.ts
      token-verify.ts
      game-join-token.ts
    db/
      schema.ts
      client.ts
      migrations/
      seeds/
    game/
      engine.ts
      scoring.ts
      rules.ts
      types.ts
      constants.ts
    multiplayer/
      lobby-service.ts
      room-service.ts
      durable-object-types.ts
    three/
      scene/
        BoardScene.ts
        camera.ts
        lighting.ts
      loaders/
        gltf-loader.ts
      interaction/
        raycast.ts
      animation/
        movement.ts
      assets/
        asset-manifest.ts
    ui/
      components/
        TopBar.svelte
        GameBoard3D.svelte
        LobbyPanel.svelte
        PlayerHand.svelte
        LeaderboardTable.svelte
  routes/
    +page.svelte
    login/
    logout/
    lobby/
    leaderboard/
    game/[gameId]/
    api/
      me/
      games/
      leaderboard/
workers/
  game-room-do.ts
```

## 9. 3D rendering aanpak

### Aanbevolen stijl
- stylized low-poly
- zachte kleuren
- licht cartoony
- orthographic of quasi-isometric camera
- duidelijke silhouettes
- niet fotorealistisch

### Waarom deze stijl?
- past goed bij strategie / boardgame gevoel
- goedkoper te maken dan realistische 3D
- performanter in browser
- duidelijk leesbaar voor spelers

### Camera
Gebruik bij voorkeur een **orthographic camera** met lichte hoek, zodat het spel leest als een levend bordspel.

### MVP 3D scope
Voor de eerste 3D versie hoeft niet alles complex te zijn.

Minimaal nodig:
- board / wijk / stadstegels
- gebouwen of district props
- humanoid pionnen of eenvoudige 3D personages
- job markers
- selectie highlights
- eenvoudige loop of move animatie

Niet nodig in MVP:
- complexe gezichtsanimaties
- physics
- real-time shadows van hoge kwaliteit
- zeer gedetailleerde rigs

## 10. Performance regels

- Gebruik GLB assets
- Gebruik lage polygon counts
- Gebruik herbruikbare textures / atlas waar mogelijk
- Gebruik instancing voor herhaalde props zoals bomen, lampen, banken
- Gebruik weinig lights en werk met baked look waar mogelijk
- Houd mobiele ondersteuning eenvoudig of maak desktop-first

## 11. Samenvatting definitieve keuze

### Beste combinatie voor jouw doel
```text
SvelteKit + TypeScript
Cloudflare Pages + Workers
Cloudflare D1
Cloudflare Durable Objects
Auth0
Three.js
GLB low-poly assets
```

Dat is eenvoudig genoeg om goedkoop te hosten, sterk genoeg voor online multiplayer en flexibel genoeg om jouw spel later verder uit te bouwen.
