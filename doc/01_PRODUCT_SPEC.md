# Humanoid Horizons Webgame - Product Specificatie

## Doel
Maak een eenvoudige webgame op basis van het bordspelidee **Humanoid Horizons**. De eerste versie moet vooral de spel-flow valideren: spelers bouwen een humanoid-uitzendbedrijf, lossen personeelstekorten op, beheren kosten, kiezen leveranciers en navigeren door continentale regelgeving.

## Doelgroep
- Jongeren vanaf 12 jaar
- Volwassenen en families
- Mensen met interesse in AI, robots, business, strategie en technologie

## MVP-principe
De eerste versie hoeft geen perfecte game te zijn. Ze moet snel speelbaar zijn in de browser, goedkoop te hosten en eenvoudig uitbreidbaar.

## Kernervaring
Een speler start als klein bedrijf en probeert opdrachten uit te voeren met humanoids. Elke opdracht heeft vereisten zoals sector, regio, vaardigheden, regelgeving en kostendruk. De speler koopt humanoid-kaarten, kiest leveranciers, beheert cashflow en bouwt reputatie op.

## Spelmodi voor MVP
### 1. Solo prototype
De speler speelt tegen het systeem over 10 rondes.

### 2. Lokale multiplayer later
Meerdere spelers op hetzelfde scherm of via gedeelde sessie.

### 3. Online multiplayer later
Niet in MVP. Alleen voorzien in de architectuur zodat het later kan.

## Winconditie MVP
Na 10 rondes wint de speler als aan minstens 2 van deze 3 voorwaarden voldaan is:
- Cash is groter dan 0
- Reputatie is minstens 50
- Minstens 6 succesvolle opdrachten uitgevoerd

## Verliesconditie MVP
De speler verliest onmiddellijk als:
- Cash lager wordt dan -20
- Reputatie lager wordt dan 0
- 3 compliance-fouten gebeuren in dezelfde regio

## Belangrijkste resources
- Cash
- Reputatie
- Humanoids
- Leveranciers
- Compliance status per continent
- Opdrachten
- Actiepunten per ronde

## Hoofdloop per ronde
1. Nieuwe marktsituatie wordt getoond
2. Nieuwe opdrachten verschijnen
3. Speler kiest maximaal 2 acties
4. Speler zet humanoids in op opdrachten
5. Systeem berekent resultaat
6. Kosten, inkomsten, reputatie en compliance worden bijgewerkt
7. Volgende ronde start

## Speleracties
- Koop humanoid
- Upgrade humanoid
- Contracteer leverancier
- Voer opdracht uit
- Doe compliance check
- Investeer in training
- Bespaar kosten
- Breid uit naar nieuw continent

## Continentsysteem
Gebruik continenten in plaats van landen:
- Europa
- Noord-Amerika
- Zuid-Amerika
- Azië
- Afrika
- Oceanië

Elke regio heeft eigen regels, marktkansen en beperkingen.

## MVP-content
### Sectoren
- Zorg
- Logistiek
- Facility services
- Landbouw
- Retail

### Regelgeving
- Europa: streng, hoge compliance-kost, hoge reputatiewinst
- Noord-Amerika: commerciële snelheid, middelmatige compliance
- Azië: sterke productie, snellere beschikbaarheid
- Afrika: groeiende markt, beperkte infrastructuur
- Zuid-Amerika: prijsgevoelig, logistieke uitdagingen
- Oceanië: nichemarkt, hoge operationele kosten

## Uitbreidbaarheid
Nieuwe humanoid-kaarten, leveranciers, opdrachten en regelgeving moeten via data toegevoegd kunnen worden zonder de gamecode te herschrijven.

## Niet in MVP
- Betalingen
- Accountbeheer met wachtwoorden
- Echte online multiplayer
- Complexe AI-tegenstanders
- Animaties met 3D robots
- Marketplace voor uitbreidingen

## Succescriteria MVP
De MVP is geslaagd als:
- Een speler het spel volledig kan spelen in minder dan 20 minuten
- Nieuwe humanoids via database/seed data toegevoegd kunnen worden
- De kernflow duidelijk voelt zonder handleiding van 20 pagina’s
- De hosting bijna gratis kan blijven bij beperkt gebruik
