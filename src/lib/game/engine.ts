import type {
	GameState, GameAction, ActionResult, PlayerState, PlayerHumanoid,
	Job, JobResult, ScoreBreakdown, ImpactScore, Continent, EventLogEntry, Sector
} from './types.js';
import {
	STARTING_CASH, STARTING_REPUTATION, STARTING_ACTION_POINTS, MAX_ROUNDS,
	LOSS_CASH_THRESHOLD, WIN_REPUTATION_THRESHOLD, WIN_JOBS_THRESHOLD,
	ACTION_COSTS, CONTINENT_CONFIG, HUMANOID_CARDS, ALL_JOBS, SUPPLIERS,
	MARKET_EVENTS, PLAYER_COLORS, PLAYER_NAMES, SECTOR_TYPE_BONUS,
	TRAINING_MULTIPLIER, UPGRADE_MULTIPLIER, TRAINING_COST
} from './constants.js';

let humanoidCounter = 0;

function defaultContinents(): Record<Continent, { unlocked: boolean; complianceScore: number; complianceFailures: number }> {
	const continents = {} as Record<Continent, { unlocked: boolean; complianceScore: number; complianceFailures: number }>;
	for (const [key, config] of Object.entries(CONTINENT_CONFIG)) {
		continents[key as Continent] = {
			unlocked: key === 'europe',
			complianceScore: config.baseCompliance,
			complianceFailures: 0,
		};
	}
	return continents;
}

export function createPlayer(index: number, name?: string): PlayerState {
	return {
		id: index,
		name: name || PLAYER_NAMES[index] || `Speler ${index + 1}`,
		color: PLAYER_COLORS[index] || '#888888',
		cash: STARTING_CASH,
		reputation: STARTING_REPUTATION,
		actionPoints: STARTING_ACTION_POINTS,
		humanoids: [],
		suppliers: [],
		continents: defaultContinents(),
		successfulJobs: 0,
		failedJobs: 0,
		totalFitScore: 0,
		jobsScored: 0,
		sectorReputation: { healthcare: 0, logistics: 0, facility: 0, agriculture: 0, retail: 0 },
		trainingsCompleted: 0,
		upgradesCompleted: 0,
		jobsThisRound: 0,
		travelCount: 0,
	};
}

export function createGame(playerCount: number, playerNames?: string[]): GameState {
	const players: PlayerState[] = [];
	for (let i = 0; i < playerCount; i++) {
		players.push(createPlayer(i, playerNames?.[i]));
	}

	return {
		players,
		currentPlayerIndex: 0,
		round: 1,
		maxRounds: MAX_ROUNDS,
		status: 'active',
		availableJobs: pickRandomJobs(3 + playerCount),
		availableHumanoids: pickRandomHumanoids(),
		activeMarketEvent: null,
		eventLog: [],
	};
}

function pickRandomJobs(count: number): Job[] {
	const shuffled = [...ALL_JOBS].sort(() => Math.random() - 0.5);
	return shuffled.slice(0, count);
}

function pickRandomHumanoids(): typeof HUMANOID_CARDS {
	const robots = HUMANOID_CARDS.filter(h => h.type === 'robot');
	const humans = HUMANOID_CARDS.filter(h => h.type === 'human');
	const pickedRobots = [...robots].sort(() => Math.random() - 0.5).slice(0, 3);
	const pickedHumans = [...humans].sort(() => Math.random() - 0.5).slice(0, 3);
	return [...pickedRobots, ...pickedHumans];
}

function currentPlayer(state: GameState): PlayerState {
	return state.players[state.currentPlayerIndex];
}

function addLog(state: GameState, message: string, type: EventLogEntry['type'] = 'info'): void {
	state.eventLog.push({
		round: state.round,
		playerId: state.currentPlayerIndex,
		message,
		type,
	});
}

export function processAction(state: GameState, action: GameAction): ActionResult {
	const newState = structuredClone(state);
	const player = currentPlayer(newState);

	if (newState.status !== 'active') {
		return { success: false, message: 'Het spel is niet actief.', updatedState: state };
	}

	if (action.type === 'END_TURN') {
		return endTurn(newState);
	}

	const costs = ACTION_COSTS[action.type];
	if (player.actionPoints < costs.actionPoints) {
		return { success: false, message: 'Niet genoeg actiepunten.', updatedState: state };
	}
	if ('cash' in costs && player.cash < costs.cash) {
		return { success: false, message: 'Niet genoeg cash.', updatedState: state };
	}

	let result: ActionResult;

	switch (action.type) {
		case 'BUY_HUMANOID':
			result = handleBuyHumanoid(newState, player, action.humanoidCardId);
			break;
		case 'UPGRADE_HUMANOID':
			result = handleUpgradeHumanoid(newState, player, action.playerHumanoidId, action.sector);
			break;
		case 'CONTRACT_SUPPLIER':
			result = handleContractSupplier(newState, player, action.supplierId);
			break;
		case 'RUN_COMPLIANCE_CHECK':
			result = handleComplianceCheck(newState, player, action.continent);
			break;
		case 'TRAIN_HUMANOID':
			result = handleTrainHumanoid(newState, player, action.playerHumanoidId, action.sector);
			break;
		case 'ASSIGN_JOB':
			result = handleAssignJob(newState, player, action.activeJobId, action.playerHumanoidId);
			break;
		case 'EXPAND_REGION':
			result = handleExpandRegion(newState, player, action.continent);
			break;
	}

	return result;
}

function handleBuyHumanoid(state: GameState, player: PlayerState, cardId: string): ActionResult {
	const card = state.availableHumanoids.find(h => h.id === cardId);
	if (!card) return { success: false, message: 'Humanoid niet beschikbaar.', updatedState: state };
	if (player.cash < card.cost) return { success: false, message: 'Niet genoeg cash.', updatedState: state };

	player.cash -= card.cost;
	player.actionPoints -= 1;
	const ph: PlayerHumanoid = {
		id: `ph_${++humanoidCounter}`,
		card: { ...card },
		baseSkills: { ...card.skills },
		trainingGains: { healthcare: 0, logistics: 0, facility: 0, agriculture: 0, retail: 0 },
		upgradeGains: { healthcare: 0, logistics: 0, facility: 0, agriculture: 0, retail: 0 },
		trainingLevel: 0,
		condition: 100,
		assignedJobId: null,
		trainingSector: null,
		trainingTurnsLeft: 0,
		safety: card.safety,
		lastUsedRound: state.round,
		lastContinent: null,
	};
	player.humanoids.push(ph);
	state.availableHumanoids = state.availableHumanoids.filter(h => h.id !== cardId);

	addLog(state, `${player.name} kocht ${card.name} voor ${card.cost} cash.`, 'info');
	return { success: true, message: `${card.name} gekocht!`, updatedState: state };
}

function handleUpgradeHumanoid(state: GameState, player: PlayerState, phId: string, sector: Sector): ActionResult {
	const humanoid = player.humanoids.find(h => h.id === phId);
	if (!humanoid) return { success: false, message: 'Humanoid niet gevonden.', updatedState: state };
	if (humanoid.trainingTurnsLeft > 0) return { success: false, message: 'Humanoid is in training.', updatedState: state };

	player.cash -= 20;
	player.actionPoints -= 1;
	player.upgradesCompleted += 1;
	humanoid.condition = Math.min(100, humanoid.condition + 30);
	const baseGain = 10;
	const multiplier = UPGRADE_MULTIPLIER[humanoid.card.type];
	const gain = Math.round(baseGain * multiplier);
	const oldSkill = humanoid.card.skills[sector];
	humanoid.card.skills[sector] = Math.min(100, oldSkill + gain);
	humanoid.upgradeGains[sector] += humanoid.card.skills[sector] - oldSkill;
	if (humanoid.card.type === 'robot') {
		humanoid.safety = Math.min(100, humanoid.safety + 10);
	}

	const SECTOR_NL: Record<Sector, string> = { healthcare: 'Zorg', logistics: 'Logistiek', facility: 'Facilitair', agriculture: 'Agri', retail: 'Retail' };
	addLog(state, `${player.name} upgradede ${humanoid.card.name} in ${SECTOR_NL[sector]} (+${gain}, conditie hersteld).`, 'info');
	return { success: true, message: `${humanoid.card.name} geüpgraded in ${SECTOR_NL[sector]}! (+${gain} skill)`, updatedState: state };
}

function handleContractSupplier(state: GameState, player: PlayerState, supplierId: string): ActionResult {
	const supplier = SUPPLIERS.find(s => s.id === supplierId);
	if (!supplier) return { success: false, message: 'Leverancier niet gevonden.', updatedState: state };
	if (player.suppliers.some(s => s.id === supplierId)) return { success: false, message: 'Al gecontracteerd.', updatedState: state };
	if (player.cash < supplier.setupCost) return { success: false, message: 'Niet genoeg cash.', updatedState: state };
	if (!player.continents[supplier.continent].unlocked) return { success: false, message: 'Continent niet ontgrendeld.', updatedState: state };

	player.cash -= supplier.setupCost;
	player.actionPoints -= 1;
	player.suppliers.push({ ...supplier });

	addLog(state, `${player.name} contracteerde ${supplier.name}.`, 'info');
	return { success: true, message: `${supplier.name} gecontracteerd!`, updatedState: state };
}

function handleComplianceCheck(state: GameState, player: PlayerState, continent: Continent): ActionResult {
	if (!player.continents[continent].unlocked) return { success: false, message: 'Continent niet ontgrendeld.', updatedState: state };

	player.cash -= 10;
	player.actionPoints -= 1;
	player.continents[continent].complianceScore = Math.min(100, player.continents[continent].complianceScore + 15);

	addLog(state, `${player.name} deed compliance check in ${CONTINENT_CONFIG[continent].name}.`, 'info');
	return { success: true, message: `Compliance in ${CONTINENT_CONFIG[continent].name} verbeterd!`, updatedState: state };
}

function handleTrainHumanoid(state: GameState, player: PlayerState, phId: string, sector: Sector): ActionResult {
	const humanoid = player.humanoids.find(h => h.id === phId);
	if (!humanoid) return { success: false, message: 'Resource niet gevonden.', updatedState: state };
	if (humanoid.trainingTurnsLeft > 0) return { success: false, message: 'Resource is al in training.', updatedState: state };
	if (humanoid.assignedJobId) return { success: false, message: 'Resource is bezig met een opdracht.', updatedState: state };

	const cost = TRAINING_COST[humanoid.card.type];
	if (player.cash < cost) return { success: false, message: `Niet genoeg cash (${cost} nodig).`, updatedState: state };

	player.cash -= cost;
	player.actionPoints -= 1;
	player.trainingsCompleted += 1;
	humanoid.trainingLevel += 1;
	humanoid.trainingSector = sector;
	humanoid.trainingTurnsLeft = 1;
	if (humanoid.card.type === 'robot') {
		humanoid.safety = Math.min(100, humanoid.safety + 15);
	}

	const SECTOR_NL: Record<Sector, string> = { healthcare: 'Zorg', logistics: 'Logistiek', facility: 'Facilitair', agriculture: 'Agri', retail: 'Retail' };
	addLog(state, `${player.name} stuurt ${humanoid.card.name} op training in ${SECTOR_NL[sector]} (1 beurt niet inzetbaar).`, 'info');
	return { success: true, message: `${humanoid.card.name} in training voor ${SECTOR_NL[sector]}! Volgende beurt weer beschikbaar.`, updatedState: state };
}

function handleAssignJob(state: GameState, player: PlayerState, jobId: string, phId: string): ActionResult {
	if (player.jobsThisRound >= state.round) {
		return { success: false, message: `Je mag maximaal ${state.round} opdracht${state.round > 1 ? 'en' : ''} uitvoeren in ronde ${state.round}.`, updatedState: state };
	}

	const job = state.availableJobs.find(j => j.id === jobId);
	if (!job) return { success: false, message: 'Opdracht niet beschikbaar.', updatedState: state };

	const humanoid = player.humanoids.find(h => h.id === phId);
	if (!humanoid) return { success: false, message: 'Humanoid niet gevonden.', updatedState: state };
	if (humanoid.assignedJobId) return { success: false, message: 'Humanoid is al bezig met een opdracht.', updatedState: state };
	if (humanoid.trainingTurnsLeft > 0) return { success: false, message: 'Humanoid is in training en niet inzetbaar.', updatedState: state };
	if (!player.continents[job.continent].unlocked) return { success: false, message: 'Continent niet ontgrendeld.', updatedState: state };

	player.actionPoints -= 1;
	player.jobsThisRound += 1;
	humanoid.lastUsedRound = state.round;

	if (humanoid.lastContinent && humanoid.lastContinent !== job.continent) {
		player.travelCount += 1;
		addLog(state, `${humanoid.card.name} reist van ${CONTINENT_CONFIG[humanoid.lastContinent].name} naar ${CONTINENT_CONFIG[job.continent].name} (-duurzaamheid).`, 'warning');
	}
	humanoid.lastContinent = job.continent;

	const jobResult = calculateJobResult(humanoid, job, player);
	humanoid.assignedJobId = null;

	player.totalFitScore += jobResult.finalScore;
	player.jobsScored += 1;

	if (jobResult.outcome === 'success') {
		player.cash += job.reward;
		player.reputation += job.reputationReward;
		player.sectorReputation[job.sector] += job.reputationReward;
		player.successfulJobs += 1;
		humanoid.condition -= 5;
		addLog(state, `${humanoid.card.name} voltooide "${job.title}" succesvol! +${job.reward} cash, +${job.reputationReward} reputatie (${job.sector}).`, 'success');
	} else if (jobResult.outcome === 'partial') {
		player.cash += Math.floor(job.reward * 0.5);
		player.reputation += 1;
		player.sectorReputation[job.sector] += 1;
		humanoid.condition -= 10;
		addLog(state, `${humanoid.card.name} voltooide "${job.title}" gedeeltelijk. ${jobResult.details}`, 'warning');
	} else {
		player.cash -= 10;
		player.reputation -= 5;
		player.sectorReputation[job.sector] = Math.max(0, player.sectorReputation[job.sector] - 2);
		player.failedJobs += 1;
		humanoid.condition -= 15;
		if (CONTINENT_CONFIG[job.continent].baseCompliance > 60 && Math.random() < 0.3) {
			player.continents[job.continent].complianceFailures += 1;
			addLog(state, `Compliance fout in ${CONTINENT_CONFIG[job.continent].name}!`, 'error');
		}
		addLog(state, `${humanoid.card.name} faalde bij "${job.title}". ${jobResult.details}`, 'error');
	}

	state.availableJobs = state.availableJobs.filter(j => j.id !== jobId);

	checkLossConditions(state, player);

	return { success: true, message: `Opdracht resultaat: ${jobResult.outcome}. ${jobResult.details}`, updatedState: state };
}

function rollDice(): number {
	const d1 = Math.floor(Math.random() * 6) + 1;
	const d2 = Math.floor(Math.random() * 6) + 1;
	return d1 + d2 - 7; // range: -5 to +5
}

export function calculateScoreBreakdown(humanoid: PlayerHumanoid, job: Job, player: PlayerState, includeDice: boolean = false): ScoreBreakdown {
	const skillScore = humanoid.card.skills[job.sector];
	const reliabilityScore = Math.round(humanoid.card.reliability * 0.3);
	const trainingBonus = humanoid.trainingLevel * 5;
	const complianceModifier = Math.round((player.continents[job.continent].complianceScore - job.complianceLevel) * 0.1);
	const conditionPenalty = humanoid.condition < 50 ? Math.round((50 - humanoid.condition) * 0.3) : 0;
	const riskPenalty = job.risk;

	let supplierBonus = 0;
	for (const s of player.suppliers) {
		if (s.skillBoost[job.sector]) {
			supplierBonus += s.skillBoost[job.sector]!;
		}
	}

	const sectorBonus = SECTOR_TYPE_BONUS[job.sector];
	const typeBonus = humanoid.card.type === sectorBonus.preferred ? sectorBonus.bonus : 0;
	const typeBonusLabel = typeBonus > 0 ? sectorBonus.label : '';

	const baseScore = skillScore + reliabilityScore + trainingBonus + complianceModifier + supplierBonus + typeBonus - riskPenalty - conditionPenalty;
	const diceRoll = includeDice ? rollDice() : 0;
	const finalScore = baseScore + diceRoll;

	return {
		skillScore, reliabilityScore, trainingBonus, complianceModifier,
		supplierBonus, conditionPenalty, riskPenalty, typeBonus, typeBonusLabel,
		diceRoll, baseScore, finalScore,
	};
}

function calculateJobResult(humanoid: PlayerHumanoid, job: Job, player: PlayerState): JobResult {
	const breakdown = calculateScoreBreakdown(humanoid, job, player, true);
	const { finalScore, diceRoll } = breakdown;

	const diceLabel = diceRoll > 0 ? `Geluk +${diceRoll}` : diceRoll < 0 ? `Pech ${diceRoll}` : 'Neutraal';

	let details: string;
	if (finalScore >= 70) {
		details = `Score: ${Math.round(finalScore)} (${diceLabel}). Uitstekende match!`;
		return { outcome: 'success', finalScore, breakdown, details };
	} else if (finalScore >= 50) {
		details = `Score: ${Math.round(finalScore)} (${diceLabel}). Net voldoende, maar met problemen.`;
		return { outcome: 'partial', finalScore, breakdown, details };
	} else {
		const reasons: string[] = [];
		if (breakdown.skillScore < job.requiredSkill) reasons.push('te weinig skill');
		if (breakdown.conditionPenalty > 0) reasons.push('humanoid beschadigd');
		if (breakdown.complianceModifier < -5) reasons.push('compliance te laag');
		if (diceRoll < -2) reasons.push('pech gehad');
		details = `Score: ${Math.round(finalScore)} (${diceLabel}). Mislukt: ${reasons.join(', ') || 'te moeilijk'}.`;
		return { outcome: 'failed', finalScore, breakdown, details };
	}
}

function handleExpandRegion(state: GameState, player: PlayerState, continent: Continent): ActionResult {
	if (player.continents[continent].unlocked) return { success: false, message: 'Continent al ontgrendeld.', updatedState: state };

	player.cash -= 25;
	player.actionPoints -= 1;
	player.continents[continent].unlocked = true;

	addLog(state, `${player.name} breidde uit naar ${CONTINENT_CONFIG[continent].name}!`, 'success');
	return { success: true, message: `${CONTINENT_CONFIG[continent].name} ontgrendeld!`, updatedState: state };
}

function endTurn(state: GameState): ActionResult {
	const player = currentPlayer(state);

	for (const h of player.humanoids) {
		player.cash -= h.card.maintenanceCost;
		h.assignedJobId = null;
		if (h.trainingTurnsLeft > 0) {
			h.trainingTurnsLeft -= 1;
			if (h.trainingTurnsLeft === 0 && h.trainingSector) {
				const baseGain = 8;
				const multiplier = TRAINING_MULTIPLIER[h.card.type];
				const gain = Math.round(baseGain * multiplier);
				const oldSkill = h.card.skills[h.trainingSector];
				h.card.skills[h.trainingSector] = Math.min(100, oldSkill + gain);
				h.trainingGains[h.trainingSector] += h.card.skills[h.trainingSector] - oldSkill;
				addLog(state, `${h.card.name} is klaar met training! ${h.trainingSector} +${gain}.`, 'success');
				h.trainingSector = null;
			}
		}
	}

	addLog(state, `${player.name} beëindigde de beurt. Onderhoud: -${player.humanoids.reduce((s, h) => s + h.card.maintenanceCost, 0)} cash.`, 'info');

	checkLossConditions(state, player);

	const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;

	if (nextPlayerIndex === 0) {
		state.round += 1;

		if (state.round > state.maxRounds) {
			for (const p of state.players) {
				checkWinCondition(state, p);
			}
			if (state.status === 'active') {
				const winner = state.players.reduce((best, p) => {
					const score = calculatePlayerImpactScore(p, state.maxRounds).total;
					const bestScore = calculatePlayerImpactScore(best, state.maxRounds).total;
					return score > bestScore ? p : best;
				});
				addLog(state, `Spel voorbij! ${winner.name} wint!`, 'success');
				state.status = 'won';
			}
			return { success: true, message: 'Spel voorbij!', updatedState: state };
		}

		state.availableJobs = pickRandomJobs(3 + state.players.length);
		state.availableHumanoids = pickRandomHumanoids();

		if (Math.random() < 0.4) {
			const event = MARKET_EVENTS[Math.floor(Math.random() * MARKET_EVENTS.length)];
			state.activeMarketEvent = { id: event.id, title: event.title, description: event.description };
			for (let idx = 0; idx < state.players.length; idx++) {
				state.players[idx] = event.apply(state.players[idx]);
			}
			addLog(state, `Markt event: ${event.title} - ${event.description}`, 'warning');
		} else {
			state.activeMarketEvent = null;
		}

		for (const p of state.players) {
			p.actionPoints = STARTING_ACTION_POINTS;
			p.jobsThisRound = 0;
		}
	}

	state.currentPlayerIndex = nextPlayerIndex;

	return { success: true, message: 'Beurt beëindigd.', updatedState: state };
}

export function calculatePlayerImpactScore(player: PlayerState, currentRound: number): ImpactScore {
	const winst = Math.min(25, Math.max(0, Math.floor(player.cash / 8)));

	const innovatie = Math.min(25, (player.trainingsCompleted + player.upgradesCompleted) * 3);

	let vertrouwen = 0;
	if (player.humanoids.length > 0) {
		const humans = player.humanoids.filter(h => h.card.type === 'human').length;
		const robots = player.humanoids.filter(h => h.card.type === 'robot').length;
		if (humans > 0 && robots > 0) {
			const ratio = Math.min(humans, robots) / Math.max(humans, robots);
			vertrouwen = Math.round(25 * ratio);
		}
	}

	let veiligheid = 25;
	const robots = player.humanoids.filter(h => h.card.type === 'robot');
	const humans = player.humanoids.filter(h => h.card.type === 'human');
	if (robots.length > 0 && humans.length > 0) {
		const avgRobotSafety = robots.reduce((s, r) => s + r.safety, 0) / robots.length;
		veiligheid = Math.round(25 * avgRobotSafety / 100);
		if (avgRobotSafety < 30) {
			veiligheid = Math.min(veiligheid, -5);
		}
	} else if (robots.length > 0) {
		const avgSafety = robots.reduce((s, r) => s + r.safety, 0) / robots.length;
		veiligheid = Math.round(15 * avgSafety / 100);
	}

	const unlockedContinents = Object.values(player.continents).filter(c => c.unlocked).length;
	const duurzaamheid = Math.min(25, Math.max(-10, unlockedContinents * 5 - player.travelCount * 3));

	let idlePenalty = 0;
	for (const h of player.humanoids) {
		const turnsIdle = currentRound - h.lastUsedRound;
		if (turnsIdle > 2) {
			idlePenalty += (turnsIdle - 2) * 3;
		}
	}
	const complexiteit = Math.max(-25, -idlePenalty);

	const total = winst + innovatie + vertrouwen + veiligheid + duurzaamheid + complexiteit;
	return { winst, innovatie, vertrouwen, veiligheid, duurzaamheid, complexiteit, total };
}

function checkLossConditions(state: GameState, player: PlayerState): void {
	if (player.cash < LOSS_CASH_THRESHOLD) {
		addLog(state, `${player.name} is failliet! (cash < ${LOSS_CASH_THRESHOLD})`, 'error');
		state.status = 'lost';
	}
	if (player.reputation < 0) {
		addLog(state, `${player.name} heeft alle reputatie verloren!`, 'error');
		state.status = 'lost';
	}
	for (const [continent, status] of Object.entries(player.continents)) {
		if (status.complianceFailures >= 3) {
			addLog(state, `${player.name}: 3 compliance fouten in ${CONTINENT_CONFIG[continent as Continent].name}!`, 'error');
			state.status = 'lost';
		}
	}
}

function checkWinCondition(state: GameState, player: PlayerState): void {
	const goals = [
		player.cash > 0,
		player.reputation >= WIN_REPUTATION_THRESHOLD,
		player.successfulJobs >= WIN_JOBS_THRESHOLD,
	];
	if (goals.filter(Boolean).length >= 2) {
		addLog(state, `${player.name} heeft gewonnen! (${goals.filter(Boolean).length}/3 doelen behaald)`, 'success');
	}
}
