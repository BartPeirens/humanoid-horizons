export type Continent = 'europe' | 'north-america' | 'south-america' | 'asia' | 'africa' | 'oceania';
export type Sector = 'healthcare' | 'logistics' | 'facility' | 'agriculture' | 'retail';
export type GameStatus = 'waiting' | 'active' | 'won' | 'lost';

export type WorkerType = 'robot' | 'human';

export interface HumanoidCard {
	id: string;
	name: string;
	type: WorkerType;
	cost: number;
	skills: Record<Sector, number>;
	reliability: number;
	maintenanceCost: number;
	safety: number;
	image: string | null;
}

export interface PlayerHumanoid {
	id: string;
	card: HumanoidCard;
	baseSkills: Record<Sector, number>;
	trainingGains: Record<Sector, number>;
	upgradeGains: Record<Sector, number>;
	trainingLevel: number;
	condition: number;
	assignedJobId: string | null;
	trainingSector: Sector | null;
	trainingTurnsLeft: number;
	safety: number;
	lastUsedRound: number;
	lastContinent: Continent | null;
}

export interface Supplier {
	id: string;
	name: string;
	continent: Continent;
	setupCost: number;
	bonus: string;
	skillBoost: Partial<Record<Sector, number>>;
}

export interface Job {
	id: string;
	title: string;
	sector: Sector;
	continent: Continent;
	requiredSkill: number;
	complianceLevel: number;
	risk: number;
	reward: number;
	reputationReward: number;
	explanation: string;
}

export interface MarketEvent {
	id: string;
	title: string;
	description: string;
	apply: (state: PlayerState) => PlayerState;
}

export interface ActiveMarketEventInfo {
	id: string;
	title: string;
	description: string;
}

export interface ContinentStatus {
	unlocked: boolean;
	complianceScore: number;
	complianceFailures: number;
}

export interface PlayerState {
	id: number;
	name: string;
	color: string;
	cash: number;
	reputation: number;
	actionPoints: number;
	humanoids: PlayerHumanoid[];
	suppliers: Supplier[];
	continents: Record<Continent, ContinentStatus>;
	successfulJobs: number;
	failedJobs: number;
	totalFitScore: number;
	jobsScored: number;
	sectorReputation: Record<Sector, number>;
	trainingsCompleted: number;
	upgradesCompleted: number;
	jobsThisRound: number;
	travelCount: number;
}

export interface GameState {
	players: PlayerState[];
	currentPlayerIndex: number;
	round: number;
	maxRounds: number;
	status: GameStatus;
	availableJobs: Job[];
	availableHumanoids: HumanoidCard[];
	activeMarketEvent: ActiveMarketEventInfo | null;
	eventLog: EventLogEntry[];
}

export interface EventLogEntry {
	round: number;
	playerId: number;
	message: string;
	type: 'info' | 'success' | 'warning' | 'error';
}

export type GameAction =
	| { type: 'BUY_HUMANOID'; humanoidCardId: string }
	| { type: 'UPGRADE_HUMANOID'; playerHumanoidId: string; sector: Sector }
	| { type: 'CONTRACT_SUPPLIER'; supplierId: string }
	| { type: 'RUN_COMPLIANCE_CHECK'; continent: Continent }
	| { type: 'TRAIN_HUMANOID'; playerHumanoidId: string; sector: Sector }
	| { type: 'ASSIGN_JOB'; activeJobId: string; playerHumanoidId: string }
	| { type: 'EXPAND_REGION'; continent: Continent }
	| { type: 'END_TURN' };

export interface ActionResult {
	success: boolean;
	message: string;
	updatedState: GameState;
}

export interface ScoreBreakdown {
	skillScore: number;
	reliabilityScore: number;
	trainingBonus: number;
	complianceModifier: number;
	supplierBonus: number;
	conditionPenalty: number;
	riskPenalty: number;
	typeBonus: number;
	typeBonusLabel: string;
	diceRoll: number;
	baseScore: number;
	finalScore: number;
}

export interface JobResult {
	outcome: 'success' | 'partial' | 'failed';
	finalScore: number;
	breakdown: ScoreBreakdown;
	details: string;
}

export interface ImpactScore {
	winst: number;
	innovatie: number;
	vertrouwen: number;
	veiligheid: number;
	duurzaamheid: number;
	complexiteit: number;
	total: number;
}
