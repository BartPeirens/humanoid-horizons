# Humanoid Horizons Webgame - UI/UX Specificatie

## 1. Visuele richting

De game mag eruitzien als een **vriendelijke stylized 3D world**. Denk aan:
- kleurrijk
- speels
- toegankelijk
- niet fotorealistisch
- "miniatuurstad / diorama / bordspel in 3D"

Belangrijke eigenschappen:
- leesbare interface
- duidelijke contrasten
- geen overvolle sci-fi HUD
- geschikt voor 12+ en volwassenen

## 2. Gewenste 3D look

Doel: een 3D scene die aanvoelt als een levend spelbord.

### Richtlijnen
- camera schuin bovenaan
- zachte materialen
- ronde vormen waar passend
- duidelijke schaduwen maar lichtgewicht
- lichte, vrolijke kleuren
- personages en humanoids eenvoudig maar herkenbaar

### Niet nodig
- realistische huid / texturen
- zware post-processing
- AAA niveau detail

## 3. UI-principe

De UI moet de speler begeleiden, niet overweldigen.

### Kernregel
De speler moet in minder dan 5 seconden kunnen zien:
- wiens beurt het is
- hoeveel cash/reputatie hij heeft
- welke acties nog mogelijk zijn
- welke jobs beschikbaar zijn
- welke humanoids hij bezit

## 4. Belangrijkste schermen

### 4.1 Home
- Titel: Humanoid Horizons
- Subtitel: Bouw het slimste humanoid-bedrijf ter wereld
- CTA: Start nieuw spel
- CTA: Bekijk regels
- CTA: Leaderboard
- Visuele hero: 3D scene of render van een futuristische miniatuurstad

### 4.2 Login
- Zeer eenvoudig scherm
- Uitleg waarom account nodig is
- Knop: Login / Sign up with Auth0

### 4.3 Lobby
- lijst open games
- knop nieuw game aanmaken
- eigen accountblok rechtsboven
- indicator als speler al in actieve game zit
- knop om terug te keren naar lopende game

### 4.4 Game scherm
Aanbevolen layout:

```text
Bovenbalk: game naam | ronde | speler aan zet | timer | leave button
Linkerzijbalk: jobs / regio info / regels
Midden: 3D board scene
Rechterzijbalk: spelers, humanoids, cash, acties
Onderaan: action bar + event log
```

## 5. 3D board ontwerp

### 5.1 Board concept
Het spelbord toont een gestileerde wereld / stad / regio als strategische speelruimte.

MVP-varianten:
1. **Wijk- of stadsbord** met verschillende sectorzones
2. **Wereldbord** met continenten als speelbare hubs
3. **Hybride**: abstracte wereldkaart in UI + 3D stadsdistrict als hoofdscene

Voor MVP raad ik aan:
- **3D district board** als hoofdscene
- continent- en regelgeving-info in zijpanelen

Dat is eenvoudiger dan meteen een volledige 3D wereldkaart.

### 5.2 Clickable elementen
De speler moet kunnen klikken op:
- humanoid pionnen
- job markers
- leveranciers
- regio tiles
- actieknoppen in UI

### 5.3 Hover feedback
Bij hover:
- subtiele glow / outline
- naam en kerninfo tonen
- cursor verandert

### 5.4 Selectie feedback
Bij selectie:
- highlight ring op grond
- klein info kaartje
- beschikbare acties tonen

## 6. Avatar / pion ontwerp

### Aanbevolen MVP
Gebruik geen supercomplexe volwaardige karakters als eerste stap.

Gebruik liever:
- simpele stylized humanoid pionnen
- verschillende kleuren / badges per speler
- eenvoudige leveranciers en job icons

Later kan je dit uitbreiden naar meer echte character models.

## 7. UI stijlgids

### Kleurgevoel
- primair: zacht blauw / cyaan
- secundair: paars
- accent: geel / lime voor successen
- waarschuwing: amber
- fout: rood
- neutraal: lichtgrijs / wit / donkergrijs tekst

### Typografie
- eenvoudige sans serif
- goed leesbaar op desktop
- niet te futuristisch

### Kaartdesign
Gebruik kaarten voor:
- humanoids
- jobs
- suppliers
- region rules
- leaderboard rows op mobiel

## 8. Animatie-aanpak

Gebruik animatie spaarzaam en nuttig.

### Goede animaties
- humanoid beweegt van punt A naar B
- job marker pulseert als beschikbaar
- geld of reputatie verandert met een kleine tween
- beurtwissel met duidelijke overgang

### Vermijd in MVP
- overbodige particle effects
- zware screen transitions
- lange intro animaties

## 9. UX voor multiplayer

### Belangrijk
Online multiplayer moet vooral duidelijk zijn.

Toon altijd:
- wie aan zet is
- hoeveel spelers in game zitten
- of iemand disconnected is
- countdown / turn timer indien gebruikt
- status "waiting for other players"

### Reconnect UX
Als speler herlaadt:
- automatisch terug in game brengen
- laatste state opnieuw laden
- duidelijke melding "reconnected"

## 10. Leaderboard UX

Toon niet alleen "wins".

Toon minstens:
- rank
- display name
- mastery rating
- wins
- games played
- average fit score
- compliance score

Zo stuur je de community naar het gewenste gedrag: humanoids slim inzetten.

## 11. Scope advies

### Beste volgorde
1. eerst functionele UI in 2D
2. daarna Three.js board toevoegen
3. daarna 3D interacties en animaties
4. pas daarna mooiere assets

Zo krijg je sneller een speelbare versie.
