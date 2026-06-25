# Humanoid Horizons Webgame - Codex Master Prompt

Gebruik deze master prompt wanneer de documentatie klaar is en Codex de codebase moet bouwen.

```text
Je bent een senior full-stack game developer en architect.

Bouw een online multiplayer webgame genaamd Humanoid Horizons.

Belangrijke context:
- Het is een strategische webgame gebaseerd op een fysiek bordspelconcept.
- Spelers beheren een humanoid-bedrijf.
- Er kunnen meerdere games tegelijk lopen.
- Elke speler kan tegelijk maar in 1 actieve game zitten.
- Elke game heeft een configureerbaar maximum aantal spelers via MAX_PLAYERS_PER_GAME.
- Er is een publiek leaderboard.
- Het leaderboard moet vooral belonen wie humanoids slim begrijpt en inzet, niet alleen wie het vaakst wint.

Technische stack:
- SvelteKit
- TypeScript
- Cloudflare adapter
- Cloudflare D1
- Drizzle ORM
- Cloudflare Durable Objects
- Auth0 voor authenticatie
- Three.js voor stylized 3D board visuals
- gewone CSS of lichte utility styling

Architectuurregels:
1. Scheid pure game domain logic van UI en framework code.
2. Bouw auth met Auth0 Universal Login en bearer tokens.
3. Valideer Auth0 tokens in server code met jose.
4. Synchroniseer ingelogde users naar een lokale D1 users tabel.
5. Gebruik Durable Objects voor realtime actieve game rooms.
6. Gebruik een short-lived signed gameJoinToken voor WebSocket room toegang.
7. Houd de eerste visuals stylized low-poly / placeholder 3D, niet fotorealistisch.
8. Gebruik orthographic of quasi-isometric camera in Three.js.
9. Maak code leesbaar, modulair en goed getypeerd.
10. Geef bij elke grote stap een korte uitleg en een overzicht van de aangemaakte bestanden.

Belangrijke functionele regels:
- protected routes: /lobby, /game/[gameId], /profile
- publieke routes: /, /how-to-play, /leaderboard, /login
- create/join game moet blokkeren als speler al in een actieve game zit
- meerdere simultane games zijn toegestaan
- games hebben statuses waiting, active, finished, cancelled, abandoned
- leaderboard gebruikt Humanoid Mastery Rating (HMR)
- HMR start op 1000
- per ranked game bereken je een Game Mastery Score (GMS) op basis van:
  - resultaat / eindplaats
  - job-humanoid fit
  - compliance
  - efficiency
  - reliability

Visual richting:
- kleurrijk
- toegankelijk
- stylized miniatuurwereld
- low-poly
- niet fotorealistisch
- levend bordspelgevoel

Aanpak:
- geef eerst een implementatieplan in fases
- bouw daarna fase per fase
- maak geen gigantische one-shot output
- vraag na elke fase om bevestiging of ga automatisch door met de volgende fase als de vorige volledig is

Begin met:
1. projectstructuur
2. dependencies
3. database schema
4. auth architectuur
5. multiplayer architectuur
6. basis UI pagina’s
7. game engine skeleton
8. leaderboard skeleton
9. Three.js placeholder board scene
```
