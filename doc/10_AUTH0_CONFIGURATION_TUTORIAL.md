# Humanoid Horizons Webgame - Volledige Auth0 Configuratie Tutorial

Deze handleiding is geschreven voor iemand met **0 voorkennis van Auth0**. Volg de stappen in volgorde.

---

## 1. Doel van deze setup

Je wil:
- spelers kunnen laten registreren en inloggen
- geen eigen wachtwoordbeheer bouwen
- een access token krijgen voor API-calls
- gebruikers in de game kunnen herkennen
- protected routes hebben zoals `/lobby` en `/game/[gameId]`

Voor Humanoid Horizons gebruiken we:
- **Auth0 Universal Login**
- **Authorization Code Flow with PKCE**
- **Single Page Application** in Auth0
- een aparte **API** in Auth0 voor bearer tokens

---

## 2. Voor je begint

Zorg dat je hebt:
- een Auth0 account
- een lokale dev URL, bv. `http://localhost:5173`
- een productie URL, bv. `https://game.jouwdomein.be`
- een lijst van routes die login nodig hebben

---

## 3. Belangrijke begrippen in simpele taal

### Tenant
Je Auth0 omgeving. Zie dit als jouw auth-projectruimte.

### Application
De app die met Auth0 praat. In jouw geval de webgame frontend.

### API
Een identifier waarvoor Auth0 access tokens uitgeeft. Jouw backend gebruikt dit om te controleren of een token voor jouw app bedoeld is.

### Callback URL
De URL waar Auth0 de gebruiker na login naar terugstuurt.

### Logout URL
De URL waar Auth0 na logout naartoe mag teruggaan.

### Web Origins
De domeinen vanwaar frontend code Auth0 mag aanspreken.

---

## 4. Stap 1 - Maak een Auth0 tenant aan

1. Maak een account aan bij Auth0.
2. Maak een tenant aan.
3. Kies een duidelijke naam, bv. `humanoid-horizons-dev`.
4. Noteer je domein, bv.:

```text
humanoid-horizons-dev.eu.auth0.com
```

Dit heb je later nodig als `AUTH0_DOMAIN`.

---

## 5. Stap 2 - Maak een Application aan

1. Ga in Auth0 naar **Applications**.
2. Kies **Create Application**.
3. Geef als naam:

```text
Humanoid Horizons Web
```

4. Kies als type:

```text
Single Page Application
```

5. Klik op Create.

### Noteer deze waarden
Na creatie zie je o.a.:
- **Domain**
- **Client ID**

Je hebt later nodig:
- `AUTH0_DOMAIN`
- `AUTH0_CLIENT_ID`

Meestal heb je voor deze setup **geen client secret nodig in de browser**.

---

## 6. Stap 3 - Configureer de Application URLs

Open je application en vul deze velden in.

### Allowed Callback URLs
Gebruik lokaal minstens:
```text
http://localhost:5173,
http://localhost:5173/callback
```

Als je productie hebt, voeg ook toe:
```text
https://game.jouwdomein.be,
https://game.jouwdomein.be/callback
```

### Allowed Logout URLs
```text
http://localhost:5173,
https://game.jouwdomein.be
```

### Allowed Web Origins
```text
http://localhost:5173,
https://game.jouwdomein.be
```

### Allowed Origins (CORS)
Gebruik indien nodig:
```text
http://localhost:5173,
https://game.jouwdomein.be
```

> Tip: gebruik exact de URL’s van je frontend. Geen trailing slash chaos.

---

## 7. Stap 4 - Maak een API aan in Auth0

1. Ga naar **Applications > APIs**.
2. Klik **Create API**.
3. Vul in:

### Name
```text
Humanoid Horizons API
```

### Identifier
Kies iets stabiels, bijvoorbeeld:
```text
https://api.humanoidhorizons
```

### Signing Algorithm
```text
RS256
```

Klik Create.

### Noteer
Deze identifier gebruik je later als:
```text
AUTH0_AUDIENCE=https://api.humanoidhorizons
```

---

## 8. Stap 5 - Zet basis login aan

In de meeste gevallen werkt Auth0 Universal Login direct.

Controleer wel:
- database connection actief
- signups toegestaan als je self-service accounts wilt
- email/password connection enabled voor je application

### Waar check je dit?
- **Authentication > Database**
- of vergelijkbare Auth0 sectie afhankelijk van UI-versie

Zorg dat je connection gekoppeld is aan je application.

---

## 9. Stap 6 - Maak testgebruikers aan (optioneel)

Voor snelle tests kan je:
- handmatig gebruikers aanmaken in Auth0
- of signup toestaan via de hosted login page

Voor MVP is signup via Universal Login meestal het gemakkelijkst.

---

## 10. Stap 7 - Voeg environment variables toe

## Lokale `.env` of `.env.local`
```env
PUBLIC_AUTH0_DOMAIN=humanoid-horizons-dev.eu.auth0.com
PUBLIC_AUTH0_CLIENT_ID=YOUR_CLIENT_ID
PUBLIC_AUTH0_AUDIENCE=https://api.humanoidhorizons
PUBLIC_AUTH0_REDIRECT_URI=http://localhost:5173
PUBLIC_APP_BASE_URL=http://localhost:5173
AUTH0_ISSUER_BASE_URL=https://humanoid-horizons-dev.eu.auth0.com/
AUTH0_AUDIENCE=https://api.humanoidhorizons
GAME_JOIN_TOKEN_SECRET=replace_with_long_random_secret
```

## Productie env vars
```env
PUBLIC_AUTH0_DOMAIN=humanoid-horizons-dev.eu.auth0.com
PUBLIC_AUTH0_CLIENT_ID=YOUR_CLIENT_ID
PUBLIC_AUTH0_AUDIENCE=https://api.humanoidhorizons
PUBLIC_AUTH0_REDIRECT_URI=https://game.jouwdomein.be
PUBLIC_APP_BASE_URL=https://game.jouwdomein.be
AUTH0_ISSUER_BASE_URL=https://humanoid-horizons-dev.eu.auth0.com/
AUTH0_AUDIENCE=https://api.humanoidhorizons
GAME_JOIN_TOKEN_SECRET=replace_with_long_random_secret
```

### Opmerking over naamgeving
- variabelen met `PUBLIC_` mogen in frontend gebruikt worden
- server-only secrets niet

---

## 11. Stap 8 - Frontend login flow

De frontend moet:
1. login redirect starten
2. na terugkeer sessie herkennen
3. access token ophalen
4. protected API routes aanroepen met bearer token

### Minimale frontend flow
- gebruiker klikt login
- Auth0 toont hosted login page
- gebruiker logt in
- gebruiker komt terug op app
- app vraagt access token met audience
- app roept `/api/me/sync` aan met token
- backend maakt lokale user aan of update die

---

## 12. Stap 9 - Backend token validatie

De backend moet elk bearer token controleren op:
- geldige handtekening
- issuer
- audience
- expiry

### Verwachte claims
Gebruik minimaal:
- `sub` -> unieke externe user id
- `email`
- `name`
- `picture`

### Lokale user sync
In D1 maak je een `users` tabel.
Bij eerste login:
- zoek op `auth0_user_id = sub`
- bestaat gebruiker niet: maak hem aan
- bestaat gebruiker wel: update display name, email, picture

---

## 13. Stap 10 - Protected routes

### Frontend protected
Pagina’s zoals:
- `/lobby`
- `/game/[gameId]`
- `/profile`

moeten controleren of de speler ingelogd is.

Als niet ingelogd:
- redirect naar `/login`
- of login prompt tonen

### Backend protected
Routes zoals:
- `POST /api/games`
- `POST /api/games/:id/join`
- `POST /api/games/:id/action`

moeten altijd een geldig bearer token eisen.

---

## 14. Stap 11 - Speler maar in 1 actieve game

Na auth gaat de backend bij create/join:
1. gebruiker ophalen via token
2. lokale user record ophalen
3. checken op actieve game
4. indien al in game: foutmelding of redirect

Dit hoort **niet** in Auth0, maar in jouw eigen app-logica.

---

## 15. Stap 12 - WebSocket join flow

Gebruik dit patroon:

1. frontend login via Auth0
2. frontend haalt access token op
3. frontend doet `POST /api/games/:id/join`
4. backend valideert Auth0 token
5. backend checkt lobby en spelerregels
6. backend geeft `gameJoinToken` terug
7. frontend opent WebSocket naar Durable Object met dat token
8. Durable Object valideert `gameJoinToken`

### Waarom is dit goed?
- simpele websocket-auth
- backend controleert regels
- Durable Object hoeft geen volledige Auth0-flow te kennen

---

## 16. Stap 13 - Testplan

Doorloop na configuratie deze tests.

### Test 1 - Signup
- maak nieuwe gebruiker aan
- verwacht: login lukt en je komt terug op homepage of lobby

### Test 2 - Login
- log in met bestaande gebruiker
- verwacht: UI toont naam/avatar

### Test 3 - Token + `/api/me/sync`
- frontend roept protected route aan
- verwacht: backend accepteert token en maakt lokale user aan

### Test 4 - Protected route zonder token
- roep `/api/games` aan zonder token
- verwacht: 401 unauthorized

### Test 5 - Create game
- ingelogde gebruiker maakt game aan
- verwacht: game record + game_player record

### Test 6 - Double active game prevention
- speler probeert tweede actieve game te maken/joinen
- verwacht: foutmelding met verwijzing naar bestaande game

### Test 7 - Logout
- gebruiker logt uit
- verwacht: terug naar publieke pagina, geen protected access meer

---

## 17. Typische fouten en hoe je ze oplost

### Fout: callback mismatch
Oorzaak:
- callback URL in app komt niet exact overeen met Auth0 config

Oplossing:
- check protocol, host, poort en pad exact

### Fout: invalid audience
Oorzaak:
- verkeerde `AUTH0_AUDIENCE`

Oplossing:
- audience moet exact overeenkomen met de Auth0 API identifier

### Fout: CORS problemen
Oorzaak:
- ontbrekende allowed origins / web origins

Oplossing:
- voeg lokale en productie frontend origin toe in Auth0

### Fout: gebruiker lijkt ingelogd maar backend weigert token
Oorzaak:
- frontend vraagt geen API access token met juiste audience

Oplossing:
- vraag token op met audience `https://api.humanoidhorizons`

### Fout: websocket connectie geweigerd
Oorzaak:
- gameJoinToken ontbreekt of is verlopen

Oplossing:
- laat backend een nieuw join token geven bij reconnect

---

## 18. Wat Codex zeker moet bouwen

Vraag Codex expliciet om:
- Auth0 SPA integratie
- bearer token retrieval
- JWT validatie met `jose`
- lokale user sync in D1
- route guards
- protected API helpers
- short-lived game join token flow

---

## 19. Samenvatting

Voor jouw project is de eenvoudigste Auth0 aanpak:

```text
Auth0 SPA Application
+ Auth0 API (audience)
+ frontend login met Universal Login
+ backend bearer token validatie
+ lokale user sync in D1
+ eigen app-regels voor game membership
```

Dat is duidelijk genoeg voor Codex om te implementeren zonder dat jij Auth0 diep moet begrijpen.
