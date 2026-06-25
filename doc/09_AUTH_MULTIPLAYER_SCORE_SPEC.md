# Humanoid Horizons Webgame - Auth, Multiplayer en Score Specificatie

## 1. Doel
Deze uitbreiding maakt van de webgame een online multiplayer game met accounts, meerdere gelijktijdige games, een limiet op het aantal spelers per game en een scoreboard dat beloont wie humanoids het best begrijpt.

Belangrijke regels:
- elke speler heeft een account
- een account kan tegelijk maar aan 1 actieve game deelnemen
- er kunnen meerdere games simultaan lopen
- elke game heeft een maximum aantal spelers gelijk aan het fysieke spelbord
- als dat aantal nog niet definitief is, maak het configureerbaar via `MAX_PLAYERS_PER_GAME`
- elke gewonnen game telt mee voor het publieke scoreboard
- de hoogste score moet niet puur naar de speler gaan die het vaakst wint, maar naar wie het beste strategisch humanoids inzet

## 2. Account- en authmodel

### Aanbevolen keuze voor MVP
**Auth0**

### Waarom?
- sneller op te zetten
- minder security-werk
- geschikt voor spelersaccounts
- Codex kan hier redelijk goed mee werken als de configuratie goed is uitgeschreven

### Lokale user sync
Hoewel Auth0 de identiteit beheert, blijft de game een eigen lokale user-tabel hebben in D1.

Daarin bewaren we:
- intern user id
- Auth0 user id (`sub`)
- display name
- email
- avatar
- user stats
- huidige actieve game id

## 3. Multiplayer model

## 3.1 Simultane games
Het systeem moet meerdere games tegelijk ondersteunen.

Elk game record heeft:
- `id`
- `status` = waiting, active, finished, cancelled, abandoned
- `max_players`
- `current_players`
- `host_user_id`
- `is_ranked`

## 3.2 Eén actieve game per speler
Een speler mag tegelijk maar in één game zitten als die game status `waiting` of `active` heeft.

### Serverregel
Bij `create game` en `join game`:
1. haal de speler op
2. controleer of hij al in een actieve game zit
3. zo ja: weiger of redirect naar bestaande game
4. zo nee: laat create/join toe

## 3.3 Game room lifecycle
### Waiting
- spelers kunnen joinen
- host kan settings aanpassen
- game kan starten als minimum aantal spelers aanwezig is

### Active
- game draait
- live sync via Durable Object
- reconnects toegestaan

### Finished
- eindscore berekend
- leaderboard geüpdatet
- actieve game link voor spelers verwijderd

## 4. Scorefilosofie

De beste speler moet niet simpelweg de speler zijn met de meeste overwinningen of de meeste gespeelde games.

De beste speler is degene die:
- jobs slim toewijst aan de juiste humanoids
- regelgeving goed beheert
- efficiënt speelt
- weinig fouten maakt
- wint door inzicht, niet door brute grind

## 5. Aanbevolen scoremodel

Gebruik een publiek leaderboard met **Humanoid Mastery Rating (HMR)**.

### Startwaarde
Elke speler start op:
```text
HMR = 1000
```

### Per game bereken je eerst een Game Mastery Score (GMS)
```text
GMS = 0 tot 100
```

#### Gewichten GMS
| Onderdeel | Gewicht | Uitleg |
|---|---:|---|
| Resultaat / eindplaats | 25 | Winnen telt mee, maar is niet alles |
| Job-Humanoid fit | 30 | Hoe goed paste de gekozen humanoid bij de taak? |
| Compliance | 20 | Hoe goed ging speler om met regio- en regelgeving? |
| Efficiency | 15 | Winstgevend en slim omgaan met middelen |
| Reliability / operationele kwaliteit | 10 | Weinig failures, downtime of verkeerde inzet |

### Waarom dit goed is
Hierdoor kan een speler die 2e wordt maar briljant speelt toch hoger scoren dan iemand die wint met slordige beslissingen.

## 6. Uitwerking van deel-scores

### 6.1 Resultaatscore (0-25)
Voorbeeld bij 4 spelers:
- 1e plaats = 25
- 2e plaats = 18
- 3e plaats = 10
- 4e plaats = 4

### 6.2 Job-Humanoid fit (0-30)
Bij elke uitgevoerde job bereken je een fit score van 0 tot 100.
Daarna neem je het gemiddelde over alle uitgevoerde jobs.

Voorbeeld deelberekening:
- capability match
- mobility match
- dexterity match
- social match
- payload / tool match

Omzetting:
```text
avg_fit_percentage * 0.30 = fit deelscore
```

### 6.3 Compliance score (0-20)
Start op 20 punten.
Trek af voor:
- overtredingen
- te laat compliance checks
- verboden toewijzingen

Voorbeeld:
- kleine fout: -2
- zware fout: -5

### 6.4 Efficiency score (0-15)
Beloon:
- winstgevende jobkeuzes
- lage kost per succesvolle job
- weinig overbodige upgrades

### 6.5 Reliability score (0-10)
Beloon:
- weinig mislukte jobs
- weinig breakdowns
- weinig ongeschikte toewijzingen

## 7. HMR update

Gebruik na elke ranked game deze eenvoudige update:

```text
delta = round((GMS - 50) * 0.6)
```

Aanvullend:
- win bonus: +5
- perfecte compliance game: +3
- zeer slechte compliance: -3

Clamp de delta bijvoorbeeld tussen:
```text
-20 en +25
```

Nieuwe rating:
```text
new_hmr = old_hmr + delta
```

## 8. Anti-grind bescherming

Om te vermijden dat iemand gewoon door extreem veel spelen bovenaan komt:
- leaderboard sorteert primair op `hmr`
- secundair op `avg_gms`
- pas daarna op `wins`
- toon ook `games_played`, maar gebruik het niet als hoofdmetric

Extra regel:
- spelers moeten minimum 5 ranked games hebben om volledig op hoofdleaderboard te komen
- tot dan kunnen ze in een provisional leaderboard staan

## 9. Wat publiek tonen op leaderboard?

Toon minstens:
- rank
- display name
- HMR
- wins
- games played
- win rate
- avg job fit
- avg compliance
- avg efficiency

## 10. Matchmaking / lobby gedrag

### Open lobby
Spelers zien:
- open games
- aantal spelers per game
- host
- ranked of casual
- max players

### Als speler al in actieve game zit
Toon:
- duidelijke banner: "Je zit al in een actieve game"
- knop: "Ga terug naar mijn game"

## 11. Aanbevolen defaults

Als het fysieke bord nog niet definitief is:
- `MAX_PLAYERS_PER_GAME = 4` als veilige MVP default
- later vervangbaar naar 5 of 6 via config

## 12. Samenvatting

Voor de webgame is de sterkste setup:
- Auth0 voor accounts
- lokale user sync in D1
- Durable Object per actieve game
- één actieve game per speler
- meerdere simultane games mogelijk
- leaderboard op basis van **Humanoid Mastery Rating**, niet enkel wins
