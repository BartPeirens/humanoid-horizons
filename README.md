# Humanoid Horizons

Een strategische 3D bordspel-webgame waar je een humanoid-uitzendbureau bouwt en beheert.

## Snel starten met Docker Compose

```bash
docker compose up -d --build
```

Open [http://localhost:3000](http://localhost:3000) in je browser.

### Stoppen

```bash
docker compose down
```

## Ontwikkelen zonder Docker

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Spelen

1. Klik op **Nieuw spel starten** op de homepagina
2. Kies het aantal spelers (1-4) en geef namen op
3. Klik **Start!**
4. Elke speler heeft per ronde 2 actiepunten om:
   - Humanoids te kopen en in te zetten op opdrachten
   - Leveranciers te contracteren
   - Uit te breiden naar nieuwe continenten
   - Humanoids te trainen of upgraden
5. Na 10 rondes wint wie aan minstens 2 van 3 doelen voldoet

## Projectstructuur

```
src/
  lib/
    game/           # Pure game logic (engine, types, constants, store)
    three/          # Three.js 3D board scene
  routes/
    +page.svelte    # Home / spel setup
    game/           # Game scherm met 3D board
    how-to-play/    # Spelregels
doc/                # Design documenten (Nederlands)
```
