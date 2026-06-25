# Humanoid Horizons Webgame - Hosting, Auth en Kosten

## 1. Aanbevolen MVP combinatie

```text
SvelteKit + TypeScript
Cloudflare Pages
Cloudflare Workers / Pages Functions
Cloudflare D1
Cloudflare Durable Objects
Auth0
Three.js
```

## 2. Waarom deze combinatie?
- goedkoop voor prototype en playtest
- eenvoudig genoeg voor AI-assisted development
- ondersteunt realtime multiplayer
- ondersteunt accounts
- ondersteunt later 3D visuals in de browser

## 3. Verwachte kostencomponenten

## Cloudflare
Gebruik Cloudflare voor:
- frontend hosting
- server routes
- D1 database
- Durable Objects voor multiplayer rooms

### Indicatieve MVP-kosten
| Onderdeel | Verwachte kost | Opmerking |
|---|---:|---|
| Cloudflare Pages | €0/maand | Voor kleine MVP vaak gratis voldoende |
| Cloudflare Workers | €0 tot ± $5/maand | Voor kleine test mogelijk gratis, multiplayer groeit sneller naar paid |
| Durable Objects | usage gebaseerd | Vaak samen te bekijken met Workers usage |
| Cloudflare D1 | €0/maand in kleine prototypefase | SQL opslag voor game data |
| Domeinnaam | ± €10-20/jaar | Optioneel |

## Auth0
Auth0 is aanbevolen voor MVP omdat het snel op te zetten is.

### Indicatieve Auth0 scenario’s
| Scenario | Verwachte kost | Opmerking |
|---|---:|---|
| Kleine demo / playtest | vaak €0/maand | zolang je binnen gratis limieten blijft |
| Grotere publieke test | afhankelijk van MAU | betaalde tier kan nodig zijn |
| Productie met meer features | hoger | afhankelijk van security/enterprise features |

### Wat je meerekent bij auth
- login / signup
- wachtwoord reset
- email verification
- eventueel social login
- beheer van users in Auth0 tenant

## Keycloak alternatief
Keycloak software is open source, maar de **operationele kost is niet nul**.

### Typische kosten Keycloak
| Onderdeel | Verwachte kost |
|---|---:|
| VPS / hosting | ± €5-20+/maand |
| database / storage | vaak inbegrepen of extra |
| beheer / updates / monitoring | tijdskost |
| backup en security beheer | tijdskost |

### Conclusie
- **Auth0** is meestal goedkoper in tijd voor MVP
- **Keycloak** kan later goedkoper of wenselijker zijn als je veel controle wilt en zelf wilt hosten

## 4. Visuals / 3D kosten

Er zijn 3 realistische opties.

### Optie A - Placeholder 3D voor MVP
- simpele primitive models
- zeer goedkoop
- snel speelbaar
- visueel beperkt

**Kost:** €0 als Codex en jij dit zelf opbouwen met simpele geometry

### Optie B - Low-poly asset-based prototype
- gebruik eenvoudige stylized 3D assets
- eigen Blender assets of eenvoudige packs
- goede middenweg

**Kost:** €0 tot enkele tientallen / honderden euro, afhankelijk van assets

### Optie C - Unieke custom art
- eigen 3D stijl en modellen
- mooier, maar trager en duurder

**Kost:** sterk afhankelijk van artiest / pipeline

## 5. Beste keuze voor jouw project

Voor een eerste speelbare online webgame raad ik aan:

### Fase 1
- Auth0
- Cloudflare
- eenvoudige 2D UI + basis game logic

### Fase 2
- multiplayer via Durable Objects
- leaderboard

### Fase 3
- stylized 3D board met Three.js
- low-poly assets

### Fase 4
- polish en custom visuals

## 6. Praktische budgetscenario’s

### Zeer kleine prototypefase
```text
€0 tot ± €10/maand
```
Mogelijk als:
- je gratis Cloudflare limieten niet overschrijdt
- Auth0 gratis limiet volstaat
- je geen custom art koopt

### Publieke testfase
```text
± €10 tot €50+/maand
```
Afhankelijk van:
- meer multiplayer usage
- meer auth usage
- domein en extra tooling

### Verder opgeschaald
```text
sterk variabel
```
Dan kijk je opnieuw naar:
- Auth0 pricing
- eventueel Keycloak
- asset pipeline
- monitoring

## 7. Aanbeveling samengevat

Als goedkoopste en eenvoudigste route:

```text
Auth0 + Cloudflare + D1 + Durable Objects + Three.js
```

Dat geeft je:
- online accounts
- meerdere gelijktijdige games
- leaderboard
- goedkope hosting
- ruimte voor stylized 3D visuals
