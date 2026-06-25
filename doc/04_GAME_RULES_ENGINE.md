# Humanoid Horizons Webgame - Game Engine Specificatie

## Kernfunctie
De game engine ontvangt een actie, controleert of die mag, past de spelstatus aan en schrijft een event log.

## Actietypes
```ts
type GameAction =
  | { type: 'BUY_HUMANOID'; humanoidCardId: string }
  | { type: 'UPGRADE_HUMANOID'; playerHumanoidId: string }
  | { type: 'CONTRACT_SUPPLIER'; supplierId: string }
  | { type: 'RUN_COMPLIANCE_CHECK'; continent: string }
  | { type: 'TRAIN_HUMANOID'; playerHumanoidId: string }
  | { type: 'ASSIGN_JOB'; activeJobId: string; playerHumanoidId: string }
  | { type: 'EXPAND_REGION'; continent: string };
```

## Algemene validatie
Voor elke actie:
1. Bestaat het spel?
2. Is het spel actief?
3. Hoort `session_id` bij het spel?
4. Heeft de speler nog actiepunten?
5. Heeft de speler voldoende cash?
6. Is de actie toegestaan in deze ronde?

## Actiekosten MVP
- Koop humanoid: kostprijs kaart, 1 actiepunt
- Upgrade humanoid: 20 cash, 1 actiepunt
- Contracteer leverancier: setup_cost, 1 actiepunt
- Compliance check: 10 cash, 1 actiepunt
- Training: 15 cash, 1 actiepunt
- Opdracht uitvoeren: 1 actiepunt
- Uitbreiden naar regio: 25 cash, 1 actiepunt

## Opdrachtresultaat
Een opdracht heeft vereisten. De humanoid heeft eigenschappen. Het systeem berekent een score.

```text
skill_score = gemiddelde van relevante humanoid skills tegenover vereisten
reliability_score = humanoid.reliability
training_bonus = training_level * 5
compliance_modifier = continent.compliance_score - job.compliance_level * 10
risk_penalty = job.risk
final_score = skill_score + reliability_score + training_bonus + compliance_modifier - risk_penalty
```

## Succesdrempel
- `final_score >= 70`: succes
- `final_score 50-69`: gedeeltelijk succes
- `final_score < 50`: mislukt

## Resultaten
### Succes
- Cash + reward
- Reputatie + reputation_reward
- Successful jobs + 1
- Humanoid condition - 5

### Gedeeltelijk succes
- Cash + 50% reward
- Reputatie + 1
- Humanoid condition - 10
- Event log vermeldt probleem

### Mislukt
- Cash - 10
- Reputatie - 5
- Failed jobs + 1
- Humanoid condition - 15
- Kans op compliance failure als continent streng is

## Ronde-einde
Bij `end-turn`:
1. Onderhoudskosten humanoids aftrekken
2. Nieuwe marktevents toepassen
3. Nieuwe opdrachten genereren
4. Actiepunten resetten naar 2
5. Ronde verhogen
6. Check win/loss

## Marktevents MVP
- Stijgende loonkosten: hogere rewards in één sector
- Nieuwe regelgeving: compliance_score daalt in één continent
- Leveringsproblemen: humanoids duurder voor 1 ronde
- Subsidieprogramma: compliance check goedkoper
- Personeelstekort piekt: meer opdrachten in één sector

## Win/loss check
```ts
function checkGameStatus(game) {
  if (game.cash < -20) return 'lost';
  if (game.reputation < 0) return 'lost';
  if (game.round > 10) {
    const goals = [
      game.cash > 0,
      game.reputation >= 50,
      game.successful_jobs >= 6
    ];
    return goals.filter(Boolean).length >= 2 ? 'won' : 'lost';
  }
  return 'active';
}
```

## Belangrijke designregel
De game moet eerlijk aanvoelen. Toon daarom altijd waarom iets slaagt of mislukt:
- Te weinig dexterity
- Compliance te laag
- Humanoid te beschadigd
- Te weinig training
- Te hoge regionale risico’s
