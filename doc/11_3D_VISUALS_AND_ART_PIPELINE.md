# Humanoid Horizons Webgame - 3D Visuals en Art Pipeline

## 1. Doel

Je wil een webgame die in de browser draait en een **vriendelijke 3D stijl** heeft, vergelijkbaar met een kleurrijke stylized miniatuurwereld. Het hoeft niet fotorealistisch te zijn. Dat is goed nieuws, want precies dat type stijl is haalbaar op het web.

## 2. Aanbevolen visuele richting

### Beste keuze voor MVP
Een **stylized low-poly / toy-like 3D look**.

Waarom?
- goedkoper en sneller te maken
- duidelijk leesbaar
- performant in browser
- past goed bij een boardgame / strategy game

### Art direction
Denk aan:
- miniatuurstad
- diorama sfeer
- isometric / top-down camera
- zachte materialen
- kleurrijke props
- simpele karakters
- geen fotorealisme

## 3. Technische keuze

### Renderengine
Gebruik:
```text
Three.js
```

### Waarom?
- web-native
- veel voorbeelden
- sterk voor stylized scenes
- werkt goed met SvelteKit

### Asset format
Gebruik:
```text
glTF / GLB
```

Dat is het standaardformaat voor web-3D assets.

## 4. Hoe worden de visuals concreet gemaakt?

Er zijn 4 lagen.

### Laag A - Concept / stijlregels
Eerst bepaal je:
- camera hoek
- kleurpalet
- schaal van objecten
- hoe humanoids eruitzien
- hoe het bord en de wereld worden opgebouwd

### Laag B - 3D assets
Daarna maak je of verzamel je assets zoals:
- grondtegels
- gebouwen
- bomen
- straatlampen
- benches / props
- job markers
- humanoid pionnen
- leveranciers / hubs

### Laag C - Scene assembly
In Three.js plaats je die assets in een scene:
- board grid
- districts
- props
- characters
- selection highlights

### Laag D - Interactie en animatie
Daarna voeg je toe:
- hover / selection
- bewegen van pionnen
- job assignment visueel tonen
- turn feedback

## 5. Goedkope productiemethodes

## Optie A - Pure prototype methode
Gebruik alleen eenvoudige geometry:
- cubes
- cylinders
- spheres
- capsules
- planes

Voordelen:
- snel
- goedkoop
- Codex kan hier meteen mee starten

Nadelen:
- minder charmant

## Optie B - Low-poly asset methode (aanbevolen)
Gebruik eenvoudige low-poly models uit Blender of een kleine asset set.

Voordelen:
- veel mooier dan pure primitives
- nog altijd lichtgewicht
- haalbaar voor een browsergame

Nadelen:
- vraagt een kleine art-pipeline

## Optie C - Volledig custom art
Mooiste optie, maar duurder en trager.

## 6. Aanbevolen MVP-scope voor assets

Maak of gebruik eerst alleen dit:

### Verplicht
- 1 grondtegel
- 1 straatsegment of pad
- 2 à 3 gebouwen
- 1 boom / bush
- 1 job marker
- 1 leverancier marker
- 1 humanoid pion model
- 1 highlight ring

### Handig
- bankje
- lantaarnpaal
- container / cargo prop
- klein billboard

Met weinig assets kan je al een overtuigende scene bouwen als je slim hergebruikt.

## 7. Aanpak voor humanoid figurines

Voor MVP is een **pion-achtige representatie** slim.

### Variant 1 - Zeer eenvoudig
- capsule body
- bol hoofd
- kleuraccent per speler

### Variant 2 - Eenvoudige low-poly humanoid
- simpele torso
- armen en benen
- weinig detail
- klein robot- of humanoidgevoel

### Variant 3 - Later
Meer uitgewerkte humanoid modellen per type of klasse.

## 8. Camera en compositie

### Beste keuze
Gebruik een **orthographic camera** of een camera die heel weinig perspectief heeft.

Waarom?
- leest beter als spelbord
- minder visuele chaos
- objecten blijven goed klikbaar
- strategisch overzicht blijft sterk

### Aanbevolen camera-instelling
- schuin van boven
- lichte rotatie zodat diepte zichtbaar is
- zoom moet aanpasbaar zijn

## 9. Lighting

Voor MVP:
- 1 hemisphere light
- 1 directional light
- zachte shadow look of fake baked look
- geen zware PBR setup nodig

Doel:
- helder en leesbaar
- vrolijke sfeer
- weinig GPU belasting

## 10. Materialen

Gebruik eenvoudige materialen:
- matte look
- lichte saturation
- geen hyperrealistic reflections
- toon/shaded of basic stylized material look kan goed werken

## 11. Scene performance regels

- houd polygon count laag
- gebruik herhaling van props
- gebruik instancing voor herhaalde objecten
- laad assets lazy waar mogelijk
- gebruik kleine textures of zelfs flat colors
- vermijd te veel lights

## 12. Hoe Codex de 3D scene moet bouwen

Laat Codex in fases werken.

### Fase 1 - Placeholder scene
- floor grid
- paar eenvoudige buildings
- pionnen als capsules
- click handling

### Fase 2 - Board logic
- koppel scene aan echte game state
- selecteer humanoids
- toon jobs
- animate movement

### Fase 3 - GLB assets
- vervang placeholders door echte low-poly assets
- voeg job markers, props en district objects toe

### Fase 4 - Polish
- betere materials
- kleine animations
- highlights en feedback

## 13. Aanbevolen bestandsstructuur voor art assets

```text
static/
  assets/
    models/
      board/
        tile_base.glb
        road_straight.glb
        building_office_a.glb
        building_factory_a.glb
        tree_small.glb
      units/
        humanoid_basic.glb
        humanoid_worker.glb
      markers/
        job_marker.glb
        supplier_marker.glb
        highlight_ring.glb
    textures/
    icons/
```

## 14. Asset manifest patroon

Maak een manifest zodat code niet overal harde paden heeft.

Voorbeeld:
```ts
export const ASSET_MANIFEST = {
  board: {
    tileBase: '/assets/models/board/tile_base.glb',
    roadStraight: '/assets/models/board/road_straight.glb'
  },
  units: {
    humanoidBasic: '/assets/models/units/humanoid_basic.glb'
  },
  markers: {
    jobMarker: '/assets/models/markers/job_marker.glb'
  }
};
```

## 15. Wat eerst bouwen?

De beste volgorde is:
1. speelbare logic zonder mooie art
2. placeholder 3D scene
3. klikbare interacties
4. realtime sync
5. low-poly assets
6. visuele polish

## 16. Samenvatting

Ja, jouw game kan zeker een **3D look in de browser** krijgen met de gekozen frameworks.

De beste praktische route is:

```text
SvelteKit + Three.js + stylized low-poly GLB assets
```

Niet fotorealistisch, maar charmant, helder en performant. Dat sluit heel goed aan bij het type voorbeeld dat je mooi vindt.
