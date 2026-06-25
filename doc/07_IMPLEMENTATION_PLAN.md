# Humanoid Horizons Webgame - Implementatieplan

## Fase 0 - Voorbereiding
Doel: project klaarzetten.

Taken:
- GitHub repository maken
- SvelteKit project aanmaken
- Cloudflare account gebruiken of aanmaken
- Cloudflare Pages project koppelen
- D1 database aanmaken
- Lokale dev omgeving testen

Resultaat:
- Lege site draait lokaal en online

## Fase 1 - Data en database
Doel: alle basisdata kunnen opslaan.

Taken:
- Drizzle installeren
- Database schema maken
- Migraties maken
- Seed data toevoegen
- Testquery’s uitvoeren

Resultaat:
- Humanoids, opdrachten, leveranciers en games staan in database

## Fase 2 - Game engine zonder UI
Doel: spelregels laten werken in TypeScript.

Taken:
- createNewGame bouwen
- performAction bouwen
- assignJob bouwen
- endTurn bouwen
- scoring bouwen
- win/loss check bouwen

Resultaat:
- Spel kan via API of tests gespeeld worden

## Fase 3 - Eerste UI
Doel: speler kan de game zien en acties doen.

Taken:
- Startpagina
- Nieuw spel pagina
- Game board layout
- Cards tonen
- Actieknoppen koppelen aan API
- Event log tonen

Resultaat:
- Eerste speelbare browserversie

## Fase 4 - Balancing
Doel: het spel leuker en eerlijker maken.

Taken:
- Minstens 10 testpotjes spelen
- Kosten en rewards aanpassen
- Mislukkingen duidelijker maken
- Ronde-events toevoegen
- Moeilijkheidsgraad toevoegen

Resultaat:
- Speelbare MVP die niet puur willekeurig voelt

## Fase 5 - Visual polish
Doel: aantrekkelijk maken voor 12+.

Taken:
- Kaartdesign verbeteren
- Iconen toevoegen
- RegionMap visueel maken
- Resultaat-popups toevoegen
- Regels pagina schrijven

Resultaat:
- Demo die je aan anderen kan tonen

## Fase 6 - Uitbreidbaarheid
Doel: klaar voor extra humanoid packs.

Taken:
- Content via seed files structureren
- Admin MVP ontwerpen
- Kaartversies toevoegen
- Pack naam toevoegen aan cards

Resultaat:
- Nieuwe humanoids kunnen later toegevoegd worden zonder game engine te wijzigen

## Aanbevolen volgorde met AI coding tool
1. Gebruik Prompt 1 voor project scaffold
2. Gebruik Prompt 2 voor database
3. Gebruik Prompt 3 voor game engine
4. Gebruik Prompt 5 voor API
5. Gebruik Prompt 4 voor UI
6. Gebruik Prompt 6 om alles speelbaar te maken
7. Gebruik Prompt 7 voor balans

## MVP-scope strikt houden
Niet toevoegen voor de eerste versie:
- Login
- Multiplayer
- Betalingen
- 3D animaties
- AI-generated content tijdens gameplay
- Uitgebreide admin

Die dingen maken het project te groot voor een eerste test.

---

# Extra fase: online multiplayer met accounts

## Fase 8: Auth0 integratie

1. Maak Auth0 tenant aan.
2. Maak een Auth0 Application aan voor de SvelteKit webgame.
3. Configureer callback URL, logout URL en allowed origins.
4. Voeg SvelteKit auth middleware toe.
5. Valideer JWT in alle protected API-routes.
6. Maak bij eerste login automatisch een `users` record in D1.
7. Voeg profielpagina toe voor nickname en avatar.

## Fase 9: Lobby en spelerlimieten

1. Maak `/lobby` pagina.
2. Toon alle games met status `waiting`.
3. Voeg create game toe met `max_players` gelijk aan het fysieke spelbord.
4. Voeg join game toe met controles:
   - user heeft geen active_game_id
   - game is waiting
   - game is niet vol
5. Zet `user.active_game_id` bij join.
6. Maak leave game mogelijk zolang de game nog niet gestart is.

## Fase 10: Realtime game rooms

1. Voeg Cloudflare Durable Objects toe.
2. Maak `GameRoom` Durable Object class.
3. Voeg WebSocket endpoint `/ws/games/:id` toe.
4. Verbind spelers in dezelfde game met hetzelfde Durable Object.
5. Laat Durable Object acties valideren en broadcasten.
6. Schrijf belangrijke state snapshots naar D1.
7. Voeg reconnect support toe.

## Fase 11: Score en leaderboards

1. Implementeer `calculateHumanoidUnderstandingScore()`.
2. Bereken score per speler bij einde game.
3. Schrijf resultaten naar `game_results`.
4. Zet `active_game_id` van alle spelers terug naar NULL.
5. Update overall leaderboard.
6. Update weekly leaderboard.
7. Update expert leaderboards.
8. Voeg badge-berekening toe.

## Fase 12: Admin

1. Gebruik Auth0 Dashboard voor accountbeheer.
2. Voeg app-adminpagina toe voor game-specifiek beheer.
3. Admin kan speler blokkeren in de game-app.
4. Admin kan foutieve active_game_id resetten.
5. Admin kan vastgelopen games annuleren.
