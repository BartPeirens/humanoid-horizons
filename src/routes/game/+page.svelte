<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import {
		gameState, currentPlayer, isGameActive, performAction, previewAction, lastMessage, resetGame,
		tutorialActive, currentTutorialStep, advanceTutorial, skipTutorial, completeTutorial
	} from '$lib/game/store';
	import { BoardScene } from '$lib/three/BoardScene';
	import { calculateScoreBreakdown, calculatePlayerImpactScore } from '$lib/game/engine';
	import { CONTINENT_CONFIG, HUMANOID_CARDS, SUPPLIERS, SECTOR_TYPE_BONUS, TRAINING_MULTIPLIER, UPGRADE_MULTIPLIER, TRAINING_COST, BUY_ACTION_POINT_COST } from '$lib/game/constants';
	import logo from '$lib/assets/logo.svg';
	import type { Continent, GameAction, PlayerHumanoid, Job, Sector, ScoreBreakdown, ImpactScore, JobResult } from '$lib/game/types';
	import Tooltip from '$lib/components/Tooltip.svelte';

	let boardContainer: HTMLElement;
	let boardScene: BoardScene | null = null;
	let selectedHumanoidId = $state<string | null>(null);
	let selectedJobId = $state<string | null>(null);
	let showShop = $state(false);
	let showSuppliers = $state(false);
	let showExpand = $state(false);
	let dragHumanoidId = $state<string | null>(null);
	let showTrainModal = $state(false);
	let showUpgradeModal = $state(false);
	let trainTargetId = $state<string | null>(null);
	let upgradeTargetId = $state<string | null>(null);
	let showGameLog = $state(false);
	let pendingAssignments = $state<Map<string, string>>(new Map());
	let collapsedPlayerIds = $state<Set<number>>(new Set());
	let zoomLevel = $state(5);
	let showEndTurnPopup = $state(false);
	let endTurnStartState = $state<import('$lib/game/types').PlayerState | null>(null);
	let endTurnStartImpact = $state<import('$lib/game/types').ImpactScore | null>(null);
	let endTurnPreviewState = $state<import('$lib/game/types').PlayerState | null>(null);
	let endTurnPreviewImpact = $state<import('$lib/game/types').ImpactScore | null>(null);
	let showPodiumPopup = $state(false);
	let turnStartSnapshot = $state<import('$lib/game/types').PlayerState | null>(null);
	let lastSnapshotKey = $state('');

	interface JobResultDisplay {
		jobTitle: string;
		jobSector: Sector;
		jobReward: number;
		jobRepReward: number;
		humanoidName: string;
		humanoidType: string;
		result: JobResult;
		actionSuccess: boolean;
		errorMessage?: string;
	}
	let showJobResultPopup = $state(false);
	let jobResultsDisplay = $state<JobResultDisplay[]>([]);
	let pendingEndTurnAfterResults = $state(false);

	function togglePlayerExpand(playerId: number) {
		const next = new Set(collapsedPlayerIds);
		if (next.has(playerId)) next.delete(playerId);
		else next.add(playerId);
		collapsedPlayerIds = next;
	}

	function isPlayerExpanded(playerId: number, isActive: boolean): boolean {
		if (collapsedPlayerIds.has(playerId)) return false;
		return isActive;
	}

	const CONTINENT_COLORS: Record<string, string> = {
		'europe': '#EF5350',
		'north-america': '#42A5F5',
		'south-america': '#66BB6A',
		'asia': '#AB47BC',
		'africa': '#FFA726',
		'oceania': '#26A69A',
	};

	function humanoidIcon(card: { type: string; image: string | null }): string {
		if (card.image) return card.image;
		return card.type === 'human' ? '\u{1F464}' : '\u{1F916}';
	}

	const SECTOR_LABELS: Record<Sector, string> = {
		healthcare: 'Zorg',
		logistics: 'Logistiek',
		facility: 'Facilitair',
		agriculture: 'Agri',
		retail: 'Retail',
	};

	function getSelectedJob() {
		if (!selectedJobId || !$gameState) return null;
		return $gameState.availableJobs.find(j => j.id === selectedJobId) ?? null;
	}

	function getSelectedHumanoid() {
		if (!selectedHumanoidId || !$currentPlayer) return null;
		return $currentPlayer.humanoids.find(h => h.id === selectedHumanoidId) ?? null;
	}

	function getBreakdown(humanoid: PlayerHumanoid, job: Job): ScoreBreakdown | null {
		const player = $currentPlayer;
		if (!player) return null;
		return calculateScoreBreakdown(humanoid, job, player);
	}

	function getFitLabel(score: number): { label: string; cls: string } {
		if (score >= 70) return { label: 'Uitstekend', cls: 'fit-excellent' };
		if (score >= 50) return { label: 'Voldoende', cls: 'fit-ok' };
		return { label: 'Zwak', cls: 'fit-weak' };
	}

	function getPendingJobForHumanoid(humanoidId: string): Job | null {
		for (const [jobId, hId] of pendingAssignments) {
			if (hId === humanoidId) {
				return $gameState?.availableJobs.find(j => j.id === jobId) ?? null;
			}
		}
		return null;
	}

	function getBestHumanoidForJob(job: Job): PlayerHumanoid | null {
		const player = $currentPlayer;
		if (!player || player.humanoids.length === 0) return null;
		let best: PlayerHumanoid | null = null;
		let bestScore = -Infinity;
		for (const h of player.humanoids) {
			if (h.assignedJobId) continue;
			const bd = getBreakdown(h, job);
			if (bd && bd.baseScore > bestScore) {
				bestScore = bd.baseScore;
				best = h;
			}
		}
		return best;
	}

	onMount(() => {
		if (!$gameState) {
			goto(`${base}/`);
			return;
		}

		boardScene = new BoardScene(boardContainer);
		boardScene.onZoomChange = (level) => { zoomLevel = level; };
		boardScene.updateGameState($gameState);

		boardScene.onContinentClick = (continent) => {
			// future: region info
		};

		boardScene.onJobClick = (jobId) => {
			selectedJobId = jobId;
			checkTutorialAction('SELECT_JOB');
		};

		boardScene.onHumanoidClick = (humanoidId) => {
			selectedHumanoidId = humanoidId;
			checkTutorialAction('SELECT_HUMANOID');
		};

		boardScene.onJobPlace = (jobId, humanoidId) => {
			const h = $currentPlayer?.humanoids.find(h => h.id === humanoidId);
			if (!h || h.trainingTurnsLeft > 0 || ($currentPlayer?.actionPoints ?? 0) < 1) return;

			const next = new Map(pendingAssignments);
			for (const [jId, hId] of next) {
				if (hId === humanoidId) next.delete(jId);
			}
			next.set(jobId, humanoidId);
			pendingAssignments = next;
		};
	});

	onDestroy(() => {
		boardScene?.dispose();
	});

	$effect(() => {
		if ($gameState && $currentPlayer) {
			const key = `${$gameState.round}-${$gameState.currentPlayerIndex}`;
			if (key !== lastSnapshotKey) {
				lastSnapshotKey = key;
				turnStartSnapshot = $state.snapshot($currentPlayer) as import('$lib/game/types').PlayerState;
			}
		}
	});

	$effect(() => {
		if ($gameState && boardScene) {
			boardScene.updateGameState($gameState);
			for (const [jobId, humanoidId] of pendingAssignments) {
				const job = $gameState.availableJobs.find(j => j.id === jobId);
				const h = $currentPlayer?.humanoids.find(h => h.id === humanoidId);
				if (job && h) {
					boardScene.placeCylinderOnJob(jobId, job.continent, h.card.name, h.card.type === 'robot');
				}
			}
		}
	});

	$effect(() => {
		if (!boardScene || !$gameState) return;
		if (selectedJobId) {
			const job = $gameState.availableJobs.find(j => j.id === selectedJobId);
			boardScene.showSelectedJob(job ?? null);
		} else {
			boardScene.showSelectedJob(null);
		}
	});

	function checkTutorialAction(actionType: string) {
		if ($tutorialActive && $currentTutorialStep?.action === actionType) {
			advanceTutorial();
		}
	}

	function closeAllPanels() {
		showShop = false;
		showSuppliers = false;
		showExpand = false;
		showTrainModal = false;
		showUpgradeModal = false;
	}

	function togglePanel(panel: 'shop' | 'suppliers' | 'expand') {
		const wasOpen = panel === 'shop' ? showShop : panel === 'suppliers' ? showSuppliers : showExpand;
		closeAllPanels();
		if (!wasOpen) {
			if (panel === 'shop') showShop = true;
			else if (panel === 'suppliers') showSuppliers = true;
			else showExpand = true;
		}
	}

	function processAndShowJobResults(afterCallback?: () => void) {
		if (!$gameState || !$currentPlayer || pendingAssignments.size === 0) {
			afterCallback?.();
			return;
		}

		const results: JobResultDisplay[] = [];
		const jobInfos = new Map<string, { job: Job; humanoidName: string; humanoidType: string }>();
		for (const [jobId, humanoidId] of pendingAssignments) {
			const job = $gameState.availableJobs.find(j => j.id === jobId);
			const humanoid = $currentPlayer.humanoids.find(h => h.id === humanoidId);
			if (job && humanoid) {
				jobInfos.set(jobId, { job, humanoidName: humanoid.card.name, humanoidType: humanoid.card.type });
			}
		}

		for (const [jobId, humanoidId] of pendingAssignments) {
			const info = jobInfos.get(jobId);
			if (!info) continue;

			const actionResult = performAction({ type: 'ASSIGN_JOB', activeJobId: jobId, playerHumanoidId: humanoidId });

			if (actionResult?.success && actionResult.jobResult) {
				results.push({
					jobTitle: info.job.title,
					jobSector: info.job.sector,
					jobReward: info.job.reward,
					jobRepReward: info.job.reputationReward,
					humanoidName: info.humanoidName,
					humanoidType: info.humanoidType,
					result: actionResult.jobResult,
					actionSuccess: true,
				});
			} else if (actionResult) {
				results.push({
					jobTitle: info.job.title,
					jobSector: info.job.sector,
					jobReward: info.job.reward,
					jobRepReward: info.job.reputationReward,
					humanoidName: info.humanoidName,
					humanoidType: info.humanoidType,
					result: { outcome: 'failed', finalScore: 0, breakdown: {} as ScoreBreakdown, details: '' },
					actionSuccess: false,
					errorMessage: actionResult.message,
				});
			}
		}

		pendingAssignments = new Map();
		boardScene?.clearAllPlacedCylinders();
		selectedJobId = null;
		selectedHumanoidId = null;

		if (results.length > 0) {
			jobResultsDisplay = results;
			showJobResultPopup = true;
			if (afterCallback) {
				pendingEndTurnAfterResults = true;
			}
		} else {
			afterCallback?.();
		}
	}

	function dismissJobResults() {
		showJobResultPopup = false;
		jobResultsDisplay = [];
		if (pendingEndTurnAfterResults) {
			pendingEndTurnAfterResults = false;
			showEndTurnFlow();
		}
	}

	function showEndTurnFlow() {
		if (!$gameState || !$currentPlayer || !turnStartSnapshot) return;

		endTurnStartState = $state.snapshot(turnStartSnapshot) as import('$lib/game/types').PlayerState;
		endTurnStartImpact = calculatePlayerImpactScore(turnStartSnapshot, $gameState.round);

		const preview = previewAction({ type: 'END_TURN' });
		if (preview && preview.success) {
			const previewPlayer = preview.updatedState.players[$currentPlayer.id];
			endTurnPreviewState = previewPlayer;
			const round = Math.min(preview.updatedState.round, $gameState.maxRounds);
			endTurnPreviewImpact = calculatePlayerImpactScore(previewPlayer, round);
		}
		showEndTurnPopup = true;
	}

	function handleEndTurnClick() {
		if (!$gameState || !$currentPlayer || !turnStartSnapshot) return;
		closeAllPanels();

		if (pendingAssignments.size > 0) {
			processAndShowJobResults(() => showEndTurnFlow());
		} else {
			showEndTurnFlow();
		}
	}

	function confirmEndTurn() {
		showEndTurnPopup = false;
		doAction({ type: 'END_TURN' });

		if ($gameState && ($gameState.status === 'won' || $gameState.status === 'lost')) {
			showPodiumPopup = true;
		}
	}

	function cancelEndTurn() {
		showEndTurnPopup = false;
		endTurnPreviewState = null;
		endTurnStartState = null;
	}

	function doAction(action: GameAction) {
		performAction(action);

		if ($tutorialActive && $currentTutorialStep?.action === action.type) {
			advanceTutorial();
		}

		selectedHumanoidId = null;
		selectedJobId = null;
		if (action.type === 'END_TURN') {
			pendingAssignments = new Map();
		}
		closeAllPanels();
	}

	function confirmPendingAssignments() {
		processAndShowJobResults();
	}

	function cancelPendingAssignment(jobId: string) {
		const next = new Map(pendingAssignments);
		next.delete(jobId);
		pendingAssignments = next;
		boardScene?.removePlacedCylinder(jobId);
	}

	function cancelAllPendingAssignments() {
		boardScene?.clearAllPlacedCylinders();
		pendingAssignments = new Map();
	}

	function handleQuit() {
		resetGame();
		goto(`${base}/`);
	}

	function handleTutorialNext() {
		const step = $currentTutorialStep;
		if (!step) return;

		if (step.id === 'done') {
			completeTutorial();
		} else if (!step.action) {
			advanceTutorial();
		}
	}

	function handleSkipTutorial() {
		skipTutorial();
	}

	function getTutorialPositionClass(position: string): string {
		return `tutorial-${position}`;
	}

	function calcCashSpentOnActions(cur: import('$lib/game/types').PlayerState, nxt: import('$lib/game/types').PlayerState): number {
		let spent = 0;
		const newHumanoids = nxt.humanoids.filter(h => !cur.humanoids.some(ch => ch.id === h.id));
		spent += newHumanoids.reduce((s, h) => s + h.card.cost, 0);
		const newSuppliers = nxt.suppliers.filter(s => !cur.suppliers.some(cs => cs.id === s.id));
		spent += newSuppliers.reduce((s, sup) => s + (SUPPLIERS.find(x => x.id === sup.id)?.setupCost ?? 0), 0);
		for (const [id, c] of Object.entries(nxt.continents)) {
			if (c.unlocked && !cur.continents[id as Continent]?.unlocked) spent += 25;
		}
		for (const h of nxt.humanoids) {
			const prev = cur.humanoids.find(ch => ch.id === h.id);
			if (h.trainingTurnsLeft > 0 && (!prev || prev.trainingTurnsLeft === 0)) {
				spent += TRAINING_COST[h.card.type];
			}
		}
		spent += (nxt.upgradesCompleted - cur.upgradesCompleted) * 20;
		return spent;
	}

	// Drag and drop handlers
	function onDragStartHumanoid(event: DragEvent, humanoidId: string) {
		if (!event.dataTransfer) return;
		event.dataTransfer.setData('text/plain', humanoidId);
		event.dataTransfer.effectAllowed = 'move';
		dragHumanoidId = humanoidId;
		selectedHumanoidId = humanoidId;

		const h = $currentPlayer?.humanoids.find(h => h.id === humanoidId);
		if (h && boardScene) {
			boardScene.setDragHumanoidInfo(humanoidId, h.card.name, h.card.type === 'robot');
		}
	}

	function onDragEndHumanoid() {
		dragHumanoidId = null;
		boardScene?.clearDragHumanoidInfo();
	}

</script>

{#if $gameState}
	{@const state = $gameState}
	{@const player = $currentPlayer}

	<div class="game-layout">
		<header class="top-bar">
			<div class="game-info">
				<img src={logo} alt="Humanoid Horizons logo" class="header-logo" />
				<span class="game-title">Humanoid Horizons</span>
				{#if $tutorialActive}
					<span class="badge badge-warning">Tutorial</span>
				{:else}
					<Tooltip text="Huidige ronde — het spel duurt {state.maxRounds} rondes. Plan je strategie!" position="bottom">
						{#snippet children()}<span class="badge badge-info">Ronde {state.round}/{state.maxRounds}</span>{/snippet}
					</Tooltip>
				{/if}
				{#if state.activeMarketEvent}
					<span class="badge badge-warning">{state.activeMarketEvent.title}</span>
				{/if}
			</div>
			<div class="turn-info">
				{#if state.status === 'active'}
					<span style="color: {player?.color}; font-weight: 700;">
						{player?.name} aan zet
					</span>
					<Tooltip text="Actiepunten — elke actie (kopen, trainen, upgraden, uitbreiden) kost 1 punt. Je krijgt 2 per ronde." position="bottom">
						{#snippet children()}<span class="badge badge-info">{player?.actionPoints} actiepunten</span>{/snippet}
					</Tooltip>
				{:else}
					<span class="badge {state.status === 'won' ? 'badge-success' : 'badge-danger'}">
						{state.status === 'won' ? 'Gewonnen!' : 'Verloren!'}
					</span>
				{/if}
			</div>
			<div class="header-actions">
				<button class="btn-outline btn-sm" onclick={() => showGameLog = !showGameLog}>
					&#x1F4DC; Spellog
				</button>
				<button class="btn-danger" onclick={handleQuit}>Verlaten</button>
			</div>
		</header>

		<div class="main-area">
			<aside class="sidebar left-sidebar" class:tutorial-highlight={$tutorialActive && $currentTutorialStep?.highlight === 'jobs'}>
				<div class="card">
					<h3>Beschikbare opdrachten</h3>
					{#if state.availableJobs.length === 0}
						<p class="empty-msg">Geen opdrachten meer deze ronde.</p>
					{/if}
					{#each state.availableJobs as job}
						{@const isSelected = selectedJobId === job.id}
						{@const continentUnlocked = player?.continents[job.continent]?.unlocked}
						{@const bestHumanoid = getBestHumanoidForJob(job)}
						{@const pendingHumanoidId = pendingAssignments.get(job.id) ?? null}
						{@const pendingH = pendingHumanoidId ? player?.humanoids.find(h => h.id === pendingHumanoidId) ?? null : null}
						{@const playerCompliance = player?.continents[job.continent]?.complianceScore ?? 0}
						{@const complianceDiff = playerCompliance - job.complianceLevel}
						<button
							class="job-item"
							class:selected={isSelected}
							class:locked={!continentUnlocked}
							onclick={() => {
								selectedJobId = isSelected ? null : job.id;
								checkTutorialAction('SELECT_JOB');
							}}
						>
							<div class="job-header">
								<div class="job-title">{job.title}</div>
								{#if !continentUnlocked}
									<span class="lock-icon" title="Continent niet ontgrendeld">&#x1F512;</span>
								{/if}
							</div>
							{#if job.explanation}
								<div class="job-explanation">{job.explanation}</div>
							{/if}
							<div class="job-meta">
								<span class="badge badge-info">{SECTOR_LABELS[job.sector]}</span>
								<span class="continent-badge" style="background: {CONTINENT_COLORS[job.continent]}20; color: {CONTINENT_COLORS[job.continent]}; border: 1px solid {CONTINENT_COLORS[job.continent]}40">
									{CONTINENT_CONFIG[job.continent].name}
								</span>
							</div>
							<div class="job-stats">
								<Tooltip position="right">
									{#snippet children()}<span class="job-stat-item">&#x1F4B0; {job.reward}</span>{/snippet}
									{#snippet content()}<span class="tt-label">Beloning</span>Cash die je verdient bij succesvolle afronding{/snippet}
								</Tooltip>
								<Tooltip position="right">
									{#snippet children()}<span class="job-stat-item">&#x2B50; +{job.reputationReward} {SECTOR_LABELS[job.sector]}</span>{/snippet}
									{#snippet content()}<span class="tt-label">Reputatie</span>Reputatiepunten in de <strong>{SECTOR_LABELS[job.sector]}</strong>-sector{/snippet}
								</Tooltip>
								<Tooltip position="right">
									{#snippet children()}<span class="job-stat-item">&#x26A0;&#xFE0F; {job.risk}</span>{/snippet}
									{#snippet content()}<span class="tt-label">Risico</span>Hoe hoger het risico, hoe meer het je score verlaagt. Risico = -{job.risk} op eindscore{/snippet}
								</Tooltip>
								<Tooltip position="right">
									{#snippet children()}<span class="job-stat-item">&#x1F3AF; {job.requiredSkill}</span>{/snippet}
									{#snippet content()}<span class="tt-label">Vereiste skill</span>Minimale sector-skill voor een goede score. Jouw humanoid moet minstens <strong>{job.requiredSkill}</strong> {SECTOR_LABELS[job.sector]}-skill hebben{/snippet}
								</Tooltip>
								<Tooltip position="right">
									{#snippet children()}<span class="job-stat-item" class:compliance-ok={complianceDiff >= 0} class:compliance-low={complianceDiff < 0}>&#x1F4CB; {job.complianceLevel}</span>{/snippet}
									{#snippet content()}<span class="tt-label">Compliance-eis</span>Deze opdracht vereist compliance <strong>{job.complianceLevel}</strong>. Jouw score in {CONTINENT_CONFIG[job.continent].name}: <strong>{playerCompliance}</strong> ({complianceDiff >= 0 ? `+${Math.round(complianceDiff * 0.1)} bonus` : `${Math.round(complianceDiff * 0.1)} straf`}).{#if complianceDiff < 0} Doe een <strong>Compliance Check</strong> (+15) om dit te verbeteren.{/if}<br><br><em>{CONTINENT_CONFIG[job.continent].regulation}</em>{/snippet}
								</Tooltip>
							</div>

							{#if pendingH}
								<div class="pending-assignment">
									<span>{humanoidIcon(pendingH.card)} {pendingH.card.name} ingepland</span>
									<span class="pending-remove" role="button" tabindex="0" onclick={(e: MouseEvent) => { e.stopPropagation(); cancelPendingAssignment(job.id); }} onkeydown={(e: KeyboardEvent) => { if (e.key === 'Enter') { e.stopPropagation(); cancelPendingAssignment(job.id); } }}>&#x274C;</span>
								</div>
							{/if}

							{#if isSelected && player}
								{@const jobsLeft = state.round - (player.jobsThisRound ?? 0)}
								<div class="assign-hint">
									{#if jobsLeft <= 0}
										<span class="job-limit-msg">Max opdrachten bereikt deze ronde.</span>
									{:else if selectedHumanoidId}
										{@const selH = getSelectedHumanoid()}
										{#if selH}
											{@const bd = getBreakdown(selH, job)}
											{#if bd}
												{@const fit = getFitLabel(bd.baseScore)}
												<span class="fit-badge {fit.cls}">{bd.baseScore} - {fit.label}</span>
											{/if}
										{/if}
										Sleep de resource naar de opdracht-kaart op het 3D bord.
									{:else}
										Selecteer een resource en sleep naar het 3D bord.
										{#if bestHumanoid}
											{@const bestBd = getBreakdown(bestHumanoid, job)}
											{#if bestBd}
												{@const bestFit = getFitLabel(bestBd.baseScore)}
												<div class="best-match">
													Beste match: <strong>{bestHumanoid.card.name}</strong>
													<span class="fit-badge {bestFit.cls}">{bestBd.baseScore}</span>
												</div>
											{/if}
										{/if}
									{/if}
									<div class="jobs-remaining">Opdrachten over: {jobsLeft}/{state.round}</div>
								</div>
							{/if}
						</button>
					{/each}
				</div>

				{#if state.activeMarketEvent}
					<div class="card event-card">
						<h4>Markt Event</h4>
						<p>{state.activeMarketEvent.description}</p>
					</div>
				{/if}
			</aside>

			<div class="board-wrapper" class:tutorial-highlight={$tutorialActive && $currentTutorialStep?.highlight === 'board'}>
				<div class="board-container" bind:this={boardContainer}></div>

				<div class="zoom-controls">
					<button class="zoom-btn" onclick={() => boardScene?.setZoomLevel(zoomLevel + 1)} disabled={zoomLevel >= 10} title="Zoom in">+</button>
					<div class="zoom-level">{zoomLevel}</div>
					<button class="zoom-btn" onclick={() => boardScene?.setZoomLevel(zoomLevel - 1)} disabled={zoomLevel <= 1} title="Zoom uit">-</button>
					<button class="zoom-btn zoom-reset" onclick={() => boardScene?.resetView()} title="Reset weergave">&#x21BA;</button>
				</div>

				<div class="map-legend">
					<div class="legend-title">Continenten</div>
					{#each Object.entries(CONTINENT_CONFIG) as [id, config]}
						{@const unlocked = player?.continents[id as Continent]?.unlocked}
						{@const cStatus = player?.continents[id as Continent]}
						<Tooltip position="right">
							{#snippet children()}
							<div class="legend-item" class:legend-locked={!unlocked}>
								<span class="legend-color" style="background: {CONTINENT_COLORS[id]}"></span>
								<span class="legend-name">{config.name}</span>
								{#if !unlocked}
									<span class="legend-lock">&#x1F512;</span>
								{:else}
									<span class="legend-compliance" class:compliance-ok={cStatus && cStatus.complianceScore >= config.baseCompliance} class:compliance-low={cStatus && cStatus.complianceScore < config.baseCompliance}>&#x1F4CB; {cStatus?.complianceScore ?? 0}</span>
									{#if cStatus && cStatus.complianceFailures > 0}
										<span class="legend-failures">&#x26A0;&#xFE0F; {cStatus.complianceFailures}/3</span>
									{/if}
								{/if}
							</div>
							{/snippet}
							{#snippet content()}<span class="tt-label">{config.name} — Regelgeving</span>{config.regulation}{#if unlocked && cStatus}<br><br>Jouw compliance: <strong>{cStatus.complianceScore}</strong> / basis {config.baseCompliance}{#if cStatus.complianceFailures > 0}<br><span class="tt-negative">Fouten: {cStatus.complianceFailures}/3 — bij 3 verlies je!</span>{/if}{/if}{/snippet}
						</Tooltip>
					{/each}
					<div class="legend-divider"></div>
					<div class="legend-item">
						<span class="legend-color" style="background: #FF6B35"></span>
						<span class="legend-name">Opdracht</span>
					</div>
					<div class="legend-hint">Scroll = zoom | Ctrl+klik of rechtermuisknop = pan</div>
				</div>
			</div>

			<aside class="sidebar right-sidebar" class:tutorial-highlight={$tutorialActive && ($currentTutorialStep?.highlight === 'players' || $currentTutorialStep?.highlight === 'humanoids')}>
				<div class="players-panel">
					{#each state.players as p, i}
						{@const isActive = i === state.currentPlayerIndex}
						{@const expanded = isPlayerExpanded(p.id, isActive)}
						{@const impact = calculatePlayerImpactScore(p, state.round)}
						{@const maintenancePerRound = p.humanoids.reduce((s, h) => s + h.card.maintenanceCost, 0)}
						{@const totalFailures = Object.values(p.continents).reduce((sum, c) => sum + c.complianceFailures, 0)}
						<div class="player-card card" class:active={isActive} style="border-left: 4px solid {p.color}">
							<button class="player-header" onclick={() => togglePlayerExpand(p.id)}>
								<div class="player-name">{p.name}</div>
								<Tooltip text="Impact Score — totaal van Winst, Innovatie, Vertrouwen, Veiligheid, Duurzaamheid en Complexiteit. Klik om details te zien." position="left">
									{#snippet children()}<div class="player-score-total">&#x1F3C6; {impact.total}</div>{/snippet}
								</Tooltip>
								<span class="expand-toggle">{expanded ? '▲' : '▼'}</span>
							</button>
							<div class="player-stats">
								<Tooltip text="Huidige cash — wordt gebruikt voor aankopen, training en uitbreiding" position="bottom">
									{#snippet children()}<span class="player-stat-item">&#x1F4B0; {p.cash}</span>{/snippet}
								</Tooltip>
								<Tooltip text="Totale reputatie — opgebouwd door succesvolle opdrachten" position="bottom">
									{#snippet children()}<span class="player-stat-item">&#x2B50; {p.reputation}</span>{/snippet}
								</Tooltip>
								<Tooltip text="Aantal resources in dienst — elke resource kost onderhoud per ronde" position="bottom">
									{#snippet children()}<span class="player-stat-item">&#x1F916; {p.humanoids.length}</span>{/snippet}
								</Tooltip>
								<Tooltip text="Succesvolle opdrachten — je hebt 6 nodig om te winnen" position="bottom">
									{#snippet children()}<span class="player-stat-item">&#x2705; {p.successfulJobs}</span>{/snippet}
								</Tooltip>
								{#if totalFailures > 0}
									<Tooltip position="bottom">
										{#snippet children()}<span class="player-stat-item compliance-failures-stat">&#x1F4CB; {totalFailures}</span>{/snippet}
										{#snippet content()}<span class="tt-label">Compliance-fouten</span>{#each Object.entries(p.continents) as [cId, cSt]}{#if cSt.complianceFailures > 0}{CONTINENT_CONFIG[cId as Continent].name}: <strong class={cSt.complianceFailures >= 2 ? 'tt-negative' : ''}>{cSt.complianceFailures}/3</strong>{#if cSt.complianceFailures >= 2} — gevaar!{/if}<br>{/if}{/each}Bij 3 fouten in één continent verlies je het spel!{/snippet}
									</Tooltip>
								{/if}
							</div>

							{#if expanded}
								<div class="player-breakdown">
									<div class="breakdown-section">
										<div class="breakdown-title">Impact Score</div>
										<Tooltip text="Gebaseerd op je netto cash. Meer winst = hogere score." position="left">
											{#snippet children()}
											<div class="breakdown-row">
												<span class="breakdown-icon">&#x1F4B0;</span>
												<span class="breakdown-label">Winst</span>
												<span class="breakdown-value">{impact.winst}/25</span>
											</div>
											{/snippet}
										</Tooltip>
										<Tooltip text="Gebaseerd op het aantal robots + upgrades. Investeer in technologie!" position="left">
											{#snippet children()}
											<div class="breakdown-row">
												<span class="breakdown-icon">&#x1F4A1;</span>
												<span class="breakdown-label">Innovatie</span>
												<span class="breakdown-value">{impact.innovatie}/25</span>
											</div>
											{/snippet}
										</Tooltip>
										<Tooltip text="Gebaseerd op reputatie en succesvolle opdrachten. Klanten vertrouwen je." position="left">
											{#snippet children()}
											<div class="breakdown-row">
												<span class="breakdown-icon">&#x1F91D;</span>
												<span class="breakdown-label">Vertrouwen</span>
												<span class="breakdown-value">{impact.vertrouwen}/25</span>
											</div>
											{/snippet}
										</Tooltip>
										<Tooltip text="Gemiddelde veiligheid van je resources. Robots beginnen laag, mensen hoog." position="left">
											{#snippet children()}
											<div class="breakdown-row">
												<span class="breakdown-icon">&#x1F6E1;&#xFE0F;</span>
												<span class="breakdown-label">Veiligheid</span>
												<span class="breakdown-value {impact.veiligheid < 0 ? 'breakdown-negative' : ''}">{impact.veiligheid}/25</span>
											</div>
											{/snippet}
										</Tooltip>
										<Tooltip text="Gebaseerd op ontgrendelde continenten (-3 per keer dat een resource naar een ander continent reist)." position="left">
											{#snippet children()}
											<div class="breakdown-row">
												<span class="breakdown-icon">&#x1F30D;</span>
												<span class="breakdown-label">Duurzaamheid</span>
												<span class="breakdown-value">{impact.duurzaamheid}/25</span>
											</div>
											{/snippet}
										</Tooltip>
										<Tooltip text="Straf voor te veel resources. Hoe meer personeel, hoe complexer het beheer." position="left">
											{#snippet children()}
											<div class="breakdown-row">
												<span class="breakdown-icon">&#x2699;&#xFE0F;</span>
												<span class="breakdown-label">Complexiteit</span>
												<span class="breakdown-value {impact.complexiteit < 0 ? 'breakdown-negative' : ''}">{impact.complexiteit}</span>
											</div>
											{/snippet}
										</Tooltip>
										<div class="breakdown-row breakdown-total">
											<span class="breakdown-icon">&#x1F3C6;</span>
											<span class="breakdown-label">Totaal</span>
											<span class="breakdown-value"><strong>{impact.total}</strong></span>
										</div>
									</div>

									<div class="breakdown-section">
										<div class="breakdown-title">Details</div>
										<Tooltip text="Totaal onderhoud dat je per ronde betaalt voor al je resources" position="left">
											{#snippet children()}
											<div class="breakdown-row">
												<span class="breakdown-icon">&#x1F4B8;</span>
												<span class="breakdown-label">Onderhoud/ronde</span>
												<span class="breakdown-value breakdown-negative">-{maintenancePerRound}</span>
											</div>
											{/snippet}
										</Tooltip>
										<Tooltip text="Aantal keer dat je een resource hebt getraind. Training verhoogt skills." position="left">
											{#snippet children()}
											<div class="breakdown-row">
												<span class="breakdown-icon">&#x1F393;</span>
												<span class="breakdown-label">Trainingen</span>
												<span class="breakdown-value">{p.trainingsCompleted}</span>
											</div>
											{/snippet}
										</Tooltip>
										<Tooltip text="Aantal upgrades uitgevoerd. Upgrades geven meer skill en herstellen conditie." position="left">
											{#snippet children()}
											<div class="breakdown-row">
												<span class="breakdown-icon">&#x2B06;&#xFE0F;</span>
												<span class="breakdown-label">Upgrades</span>
												<span class="breakdown-value">{p.upgradesCompleted}</span>
											</div>
											{/snippet}
										</Tooltip>
										<Tooltip text="Opdrachten met een te lage score. Mislukte jobs kosten reputatie." position="left">
											{#snippet children()}
											<div class="breakdown-row">
												<span class="breakdown-icon">&#x274C;</span>
												<span class="breakdown-label">Mislukte jobs</span>
												<span class="breakdown-value breakdown-negative">{p.failedJobs}</span>
											</div>
											{/snippet}
										</Tooltip>
									</div>

									{#if p.humanoids.length > 0}
										<div class="breakdown-section">
											<div class="breakdown-title">Resources</div>
											{#each p.humanoids as h}
												{@const idleTurns = state.round - h.lastUsedRound}
												<div class="breakdown-row">
													<span class="breakdown-icon">{humanoidIcon(h.card)}</span>
													<span class="breakdown-label">
														{h.card.name}
														{#if h.card.type === 'robot'}
															<span class="safety-badge" class:safety-low={h.safety < 40} class:safety-mid={h.safety >= 40 && h.safety < 70} class:safety-high={h.safety >= 70}>&#x1F6E1;&#xFE0F;{h.safety}</span>
														{/if}
														{#if idleTurns > 2}
															<span class="idle-badge">&#x1F4A4; {idleTurns}r idle</span>
														{/if}
													</span>
													<span class="breakdown-value breakdown-negative">-{h.card.maintenanceCost}/r</span>
												</div>
											{/each}
										</div>
									{/if}
								</div>
							{/if}
						</div>
					{/each}
				</div>

				{#if player && state.status === 'active'}
					<div class="card">
						<h3>Jouw resources</h3>
						{#if player.humanoids.length === 0}
							<p class="empty-msg">Nog geen resources. Koop er een!</p>
						{/if}
						{#each player.humanoids as h}
							{@const isSelected = selectedHumanoidId === h.id}
							{@const isDragging = dragHumanoidId === h.id}
							{@const selectedJobObj = getSelectedJob()}
							{@const isTraining = h.trainingTurnsLeft > 0}
							<div
								class="humanoid-item"
								class:selected={isSelected}
								class:dragging={isDragging}
								class:in-training={isTraining}
								draggable="true"
								role="button"
								tabindex="0"
								ondragstart={(e: DragEvent) => { if (isTraining || player.actionPoints < 1) { e.preventDefault(); return; } onDragStartHumanoid(e, h.id); }}
								ondragend={onDragEndHumanoid}
								onclick={() => {
									selectedHumanoidId = isSelected ? null : h.id;
									checkTutorialAction('SELECT_HUMANOID');
								}}
								onkeydown={(e: KeyboardEvent) => {
									if (e.key === 'Enter' || e.key === ' ') {
										selectedHumanoidId = isSelected ? null : h.id;
										checkTutorialAction('SELECT_HUMANOID');
									}
								}}
							>
								<div class="h-top-row">
									<div class="h-name">{humanoidIcon(h.card)} {h.card.name}</div>
									{#if h.trainingTurnsLeft > 0}
										<span class="training-badge">&#x1F393; Training</span>
									{:else if player.actionPoints < 1}
										<span class="drag-handle disabled" title="Geen actiepunten over">&#x2630;</span>
									{:else}
										<span class="drag-handle" title="Sleep naar een opdracht">&#x2630;</span>
									{/if}
								</div>
								<div class="h-stats">
									<Tooltip text="Conditie — daalt na elke opdracht. Lage conditie geeft strafpunten op je score." position="top">
										{#snippet children()}<span>&#x2764;&#xFE0F; {h.condition}%</span>{/snippet}
									</Tooltip>
									<Tooltip text="Trainingsniveau — hoger level geeft een bonus op opdracht-scores." position="top">
										{#snippet children()}<span>&#x1F393; Lv{h.trainingLevel}</span>{/snippet}
									</Tooltip>
									<Tooltip text="Betrouwbaarheid — hogere waarde geeft meer punten bij opdrachten." position="top">
										{#snippet children()}<span>&#x1F527; {h.card.reliability}%</span>{/snippet}
									</Tooltip>
									{#if h.card.type === 'robot'}
										<Tooltip text="Veiligheid — robots starten laag. Beïnvloedt je Veiligheid-score. Upgrades verhogen dit." position="top">
											{#snippet children()}<span class="safety-badge" class:safety-low={h.safety < 40} class:safety-mid={h.safety >= 40 && h.safety < 70} class:safety-high={h.safety >= 70}>&#x1F6E1;&#xFE0F; {h.safety}</span>{/snippet}
										</Tooltip>
									{/if}
									{#if h.trainingTurnsLeft > 0 && h.trainingSector}
										<Tooltip text="Deze resource traint nu en is niet beschikbaar voor opdrachten." position="top">
											{#snippet children()}<span class="training-info">Traint: {SECTOR_LABELS[h.trainingSector as Sector]}</span>{/snippet}
										</Tooltip>
									{/if}
								</div>
								<div class="h-skills">
									{#each Object.entries(h.card.skills) as [sector, level]}
										{@const isJobSector = selectedJobObj?.sector === sector}
										{@const s = sector as Sector}
										{@const base = h.baseSkills?.[s] ?? level}
										{@const trainGain = h.trainingGains?.[s] ?? 0}
										{@const upgradeGain = h.upgradeGains?.[s] ?? 0}
										{@const hasGains = trainGain > 0 || upgradeGain > 0}
										<div class="skill-bar" title={hasGains ? `Basis: ${base}${trainGain > 0 ? ` | Training: +${trainGain}` : ''}${upgradeGain > 0 ? ` | Upgrade: +${upgradeGain}` : ''} = ${level}` : `Basis: ${base}`}>
											<span class="skill-label" class:skill-match={isJobSector}>
												{SECTOR_LABELS[s]}
											</span>
											<div class="skill-track">
												<div class="skill-fill" class:skill-fill-match={isJobSector} style="width: {level}%"></div>
												{#if hasGains}
													<div class="skill-fill-base" style="width: {base}%"></div>
												{/if}
											</div>
											<span class="skill-value" class:skill-match={isJobSector}>
												{level}
												{#if hasGains}
													<span class="skill-gain-indicator">+{trainGain + upgradeGain}</span>
												{/if}
											</span>
										</div>
									{/each}
								</div>

								{#if selectedJobObj}
									{@const bd = getBreakdown(h, selectedJobObj)}
									{#if bd}
										{@const fit = getFitLabel(bd.baseScore)}
										<div class="impact-score-panel">
											<div class="impact-header">
												<span class="fit-badge {fit.cls}">{bd.baseScore} - {fit.label}</span>
											</div>
											<div class="impact-rows">
												<Tooltip text="Hoe goed de sector-skill van je resource past bij de opdracht." position="left">
													{#snippet children()}
													<div class="impact-row">
														<span class="impact-icon">&#x1F3AF;</span>
														<span class="impact-label">Skill</span>
														<span class="impact-value positive">+{bd.skillScore}</span>
													</div>
													{/snippet}
												</Tooltip>
												<Tooltip text="Bonus op basis van de betrouwbaarheid van je resource." position="left">
													{#snippet children()}
													<div class="impact-row">
														<span class="impact-icon">&#x1F527;</span>
														<span class="impact-label">Betrouwbaarheid</span>
														<span class="impact-value positive">+{bd.reliabilityScore}</span>
													</div>
													{/snippet}
												</Tooltip>
												{#if bd.trainingBonus > 0}
													<Tooltip text="Extra punten door het trainingsniveau van je resource." position="left">
														{#snippet children()}
														<div class="impact-row">
															<span class="impact-icon">&#x1F393;</span>
															<span class="impact-label">Training</span>
															<span class="impact-value positive">+{bd.trainingBonus}</span>
														</div>
														{/snippet}
													</Tooltip>
												{/if}
												{#if bd.supplierBonus > 0}
													<Tooltip text="Bonus van je gecontracteerde leverancier voor dit continent." position="left">
														{#snippet children()}
														<div class="impact-row">
															<span class="impact-icon">&#x1F3ED;</span>
															<span class="impact-label">Leverancier</span>
															<span class="impact-value positive">+{bd.supplierBonus}</span>
														</div>
														{/snippet}
													</Tooltip>
												{/if}
												{#if bd.typeBonus > 0}
													<Tooltip text="Sectorbonus voor het type resource (mens of robot)." position="left">
														{#snippet children()}
														<div class="impact-row">
															<span class="impact-icon">{h.card.type === 'human' ? '\u{2764}\u{FE0F}' : '\u{26A1}'}</span>
															<span class="impact-label">{bd.typeBonusLabel}</span>
															<span class="impact-value positive">+{bd.typeBonus}</span>
														</div>
														{/snippet}
													</Tooltip>
												{/if}
												{#if bd.complianceModifier !== 0}
													<Tooltip text="Bonus of straf op basis van of je voldoet aan de regelgeving van het continent." position="left">
														{#snippet children()}
														<div class="impact-row">
															<span class="impact-icon">&#x1F4CB;</span>
															<span class="impact-label">Compliance</span>
															<span class="impact-value {bd.complianceModifier >= 0 ? 'positive' : 'negative'}">{bd.complianceModifier >= 0 ? '+' : ''}{bd.complianceModifier}</span>
														</div>
														{/snippet}
													</Tooltip>
												{/if}
												<Tooltip text="Strafpunten op basis van het risiconiveau van de opdracht." position="left">
													{#snippet children()}
													<div class="impact-row">
														<span class="impact-icon">&#x26A0;&#xFE0F;</span>
														<span class="impact-label">Risico</span>
														<span class="impact-value negative">-{bd.riskPenalty}</span>
													</div>
													{/snippet}
												</Tooltip>
												{#if bd.conditionPenalty > 0}
													<Tooltip text="Straf door lage conditie van je resource. Repareer met upgrades." position="left">
														{#snippet children()}
														<div class="impact-row">
															<span class="impact-icon">&#x1F4A5;</span>
															<span class="impact-label">Schade</span>
															<span class="impact-value negative">-{bd.conditionPenalty}</span>
														</div>
														{/snippet}
													</Tooltip>
												{/if}
											</div>
										</div>
									{/if}
								{/if}

								{#if getPendingJobForHumanoid(h.id)}
									{@const pendingJob = getPendingJobForHumanoid(h.id)}
									{#if pendingJob}
										<div class="pending-assignment">
											<span>Ingepland: {pendingJob.title}</span>
											<button class="pending-remove" onclick={(e: MouseEvent) => { e.stopPropagation(); cancelPendingAssignment(pendingJob.id); }}>&#x274C;</button>
										</div>
									{/if}
								{:else if isSelected && selectedJobId && player.actionPoints >= 1}
									<div class="assign-drag-hint">Sleep naar het 3D bord om in te zetten</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}

			</aside>
		</div>

		<footer class="action-bar" class:tutorial-highlight={$tutorialActive && $currentTutorialStep?.highlight === 'actions'}>
			<div class="action-buttons">
				{#if state.status === 'active' && player}
					<button class="btn-primary" class:btn-active={showShop} onclick={() => togglePanel('shop')}
						disabled={player.actionPoints < 1}>
						&#x1F6D2; Koop Resources
					</button>
					<button class="btn-secondary" class:btn-active={showSuppliers} onclick={() => togglePanel('suppliers')}
						disabled={player.actionPoints < 1}>
						&#x1F3ED; Leverancier
					</button>
					<!-- Opdrachten worden toegewezen via drag-and-drop op het 3D bord -->
					{#if selectedHumanoidId}
						{@const selH = player.humanoids.find(h => h.id === selectedHumanoidId)}
						{@const trainCost = selH ? TRAINING_COST[selH.card.type] : 15}
						<button class="btn-warning"
							onclick={() => { closeAllPanels(); trainTargetId = selectedHumanoidId; showTrainModal = true; }}
							disabled={player.actionPoints < 1 || player.cash < trainCost || (selH?.trainingTurnsLeft ?? 0) > 0}>
							&#x1F393; Train ({trainCost})
						</button>
						<button class="btn-outline"
							onclick={() => { closeAllPanels(); upgradeTargetId = selectedHumanoidId; showUpgradeModal = true; }}
							disabled={player.actionPoints < 1 || player.cash < 20 || (selH?.trainingTurnsLeft ?? 0) > 0}>
							&#x2B06;&#xFE0F; Upgrade (20)
						</button>
					{/if}
					<button class="btn-primary" class:btn-active={showExpand} onclick={() => togglePanel('expand')}
						disabled={player.actionPoints < 1 || player.cash < 25}>
						&#x1F30D; Uitbreiden (25)
					</button>
					{#if pendingAssignments.size > 0}
						<button class="btn-success" onclick={confirmPendingAssignments}
							disabled={player.actionPoints < 1}>
							&#x2705; Bevestig Opdrachten ({pendingAssignments.size})
						</button>
						<button class="btn-outline btn-sm" onclick={cancelAllPendingAssignments}>
							&#x274C; Annuleer
						</button>
					{/if}
					<button class="btn-danger" onclick={handleEndTurnClick}>
						&#x23ED;&#xFE0F; Beurt beëindigen
					</button>
				{:else}
					<button class="btn-primary btn-lg" onclick={handleQuit}>Terug naar start</button>
				{/if}
			</div>

			{#if $lastMessage}
				<div class="message-bar">{$lastMessage}</div>
			{/if}

			{#if showShop}
				<div class="shop-panel card">
					<h3>&#x1F6D2; Resource Shop</h3>
					<div class="shop-grid">
						{#each state.availableHumanoids as card}
							{@const trainGain = Math.round(8 * TRAINING_MULTIPLIER[card.type])}
							{@const upgradeGain = Math.round(10 * UPGRADE_MULTIPLIER[card.type])}
							{@const trainCost = TRAINING_COST[card.type]}
							{@const sectorAdvantages = Object.entries(SECTOR_TYPE_BONUS).filter(([, v]) => v.preferred === card.type).map(([s]) => SECTOR_LABELS[s as Sector])}
							<button class="shop-item"
								onclick={() => doAction({ type: 'BUY_HUMANOID', humanoidCardId: card.id })}
								disabled={player && player.cash < card.cost}>
								<div class="shop-name">{humanoidIcon(card)} {card.name}</div>
								<div class="shop-type badge {card.type === 'human' ? 'badge-warning' : 'badge-info'}">{card.type === 'human' ? 'Mens' : 'Robot'}</div>
								<div class="shop-costs">
									<Tooltip position="top">
										{#snippet children()}<span class="shop-cost">&#x1F4B0; {card.cost} aanschaf</span>{/snippet}
										{#snippet content()}<span class="tt-label">Aanschafprijs</span>Wordt direct van je cash afgetrokken bij aankoop{/snippet}
									</Tooltip>
									<Tooltip position="top">
										{#snippet children()}<span class="shop-maintenance">&#x1F4B8; {card.maintenanceCost}/ronde</span>{/snippet}
										{#snippet content()}<span class="tt-label">Onderhoud per ronde</span>Wordt <strong>elke beurt</strong> automatisch afgetrokken bij "Beurt beëindigen". Hoe meer resources, hoe hoger je vaste kosten{/snippet}
									</Tooltip>
								</div>
								<Tooltip position="top">
									{#snippet children()}<div class="shop-reliability">&#x1F527; Betrouwbaarheid: {card.reliability}%</div>{/snippet}
									{#snippet content()}<span class="tt-label">Betrouwbaarheid</span>30% hiervan wordt als bonus bij je opdrachtscore opgeteld. <strong>{card.reliability}%</strong> → <strong class="tt-positive">+{Math.round(card.reliability * 0.3)}</strong> op elke opdracht{/snippet}
								</Tooltip>
								<div class="shop-type-traits">
									{#if card.type === 'human'}
										<Tooltip position="top">
											{#snippet children()}<span class="trait-badge trait-human">&#x2B50; Direct sterk — training +{trainGain}/keer</span>{/snippet}
											{#snippet content()}
												<span class="tt-label">Mens — eigenschappen</span>
												<div class="tt-row"><span>Training skill-groei</span><span class="tt-value">+{trainGain} per keer</span></div>
												<div class="tt-row"><span>Trainingskost</span><span class="tt-value">{trainCost} cash</span></div>
												<div class="tt-row"><span>Upgrade skill-groei</span><span class="tt-value">+{upgradeGain} per keer</span></div>
												<div class="tt-row"><span>Veiligheid</span><span class="tt-positive">Hoog (vast)</span></div>
												<div class="tt-divider"></div>
												<div>Sector-voordeel in: <strong>{sectorAdvantages.join(', ')}</strong></div>
											{/snippet}
										</Tooltip>
									{:else}
										<Tooltip position="top">
											{#snippet children()}<span class="trait-badge trait-robot">&#x1F680; Groeit snel — training +{trainGain}/keer</span>{/snippet}
											{#snippet content()}
												<span class="tt-label">Robot — eigenschappen</span>
												<div class="tt-row"><span>Training skill-groei</span><span class="tt-value">+{trainGain} per keer</span></div>
												<div class="tt-row"><span>Trainingskost</span><span class="tt-value">{trainCost} cash</span></div>
												<div class="tt-row"><span>Upgrade skill-groei</span><span class="tt-value">+{upgradeGain} per keer</span></div>
												<div class="tt-row"><span>Veiligheid</span><span class="tt-negative">Laag (groeit +15 per training)</span></div>
												<div class="tt-divider"></div>
												<div>Sector-voordeel in: <strong>{sectorAdvantages.join(', ')}</strong></div>
											{/snippet}
										</Tooltip>
									{/if}
								</div>
								<div class="shop-skills-bars">
									{#each Object.entries(card.skills) as [sector, level]}
										{@const s = sector as Sector}
										{@const bonus = SECTOR_TYPE_BONUS[s]}
										{@const hasBonus = bonus.preferred === card.type}
										<Tooltip position="right">
											{#snippet children()}
											<div class="shop-skill-bar">
												<span class="shop-skill-label" class:shop-skill-bonus={hasBonus}>{SECTOR_LABELS[s]}</span>
												<div class="skill-track">
													<div class="skill-fill" class:skill-fill-bonus={hasBonus} style="width: {level}%"></div>
												</div>
												<span class="shop-skill-value" class:shop-skill-bonus={hasBonus}>{level}</span>
											</div>
											{/snippet}
											{#snippet content()}
												<span class="tt-label">{SECTOR_LABELS[s]} skill</span>
												<div>Start: <strong>{level}</strong></div>
												<div>Na 1x training: <strong>{Math.min(100, level + trainGain)}</strong> <span class="tt-positive">(+{trainGain})</span></div>
												{#if hasBonus}
													<div class="tt-divider"></div>
													<div class="tt-positive">{bonus.label}: <strong>+{bonus.bonus}</strong> op opdrachten in deze sector</div>
												{/if}
											{/snippet}
										</Tooltip>
									{/each}
								</div>
							</button>
						{/each}
					</div>
				</div>
			{/if}

			{#if showSuppliers}
				<div class="shop-panel card">
					<h3>&#x1F3ED; Leveranciers</h3>
					<div class="shop-grid">
						{#each SUPPLIERS as s}
							{@const alreadyContracted = player?.suppliers.some(ps => ps.id === s.id) ?? false}
							{@const continentLocked = !(player?.continents[s.continent].unlocked ?? false)}
							{@const boostEntries = Object.entries(s.skillBoost) as [Sector, number][]}
							<button class="shop-item"
								onclick={() => doAction({ type: 'CONTRACT_SUPPLIER', supplierId: s.id })}
								disabled={player && (player.cash < s.setupCost || alreadyContracted || continentLocked)}>
								<div class="shop-name">{s.name}</div>
								<Tooltip position="top">
									{#snippet children()}<div class="shop-cost">&#x1F4B0; {s.setupCost} cash</div>{/snippet}
									{#snippet content()}<span class="tt-label">Eenmalige kost</span>Wordt direct van je cash afgetrokken. Daarna is de bonus <strong>permanent</strong> actief — geen doorlopende kosten{/snippet}
								</Tooltip>
								<Tooltip position="top">
									{#snippet children()}<div class="supplier-bonus">{s.bonus}</div>{/snippet}
									{#snippet content()}
										<span class="tt-label">Permanente bonus</span>
										{#each boostEntries as [sector, boost]}
											<div>Bij elke <strong>{SECTOR_LABELS[sector]}</strong>-opdracht krijg je <span class="tt-positive">+{boost}</span> extra op je score</div>
										{/each}
										<div class="tt-divider"></div>
										<div>Werkt voor <strong>alle</strong> humanoids, ongeacht type</div>
									{/snippet}
								</Tooltip>
								<Tooltip position="top">
									{#snippet children()}
									<span class="continent-badge" style="background: {CONTINENT_COLORS[s.continent]}20; color: {CONTINENT_COLORS[s.continent]}; border: 1px solid {CONTINENT_COLORS[s.continent]}40">
										{CONTINENT_CONFIG[s.continent].name}
										{#if continentLocked}&#x1F512;{/if}
									</span>
									{/snippet}
									{#snippet content()}
										<span class="tt-label">Continent</span>
										{#if continentLocked}
											<span class="tt-negative">Je moet <strong>{CONTINENT_CONFIG[s.continent].name}</strong> eerst ontgrendelen (25 cash) voordat je deze leverancier kunt contracteren</span>
										{:else}
											<span class="tt-positive">{CONTINENT_CONFIG[s.continent].name} is ontgrendeld</span>
										{/if}
									{/snippet}
								</Tooltip>
								{#if alreadyContracted}
									<span class="badge badge-success supplier-contracted">Al gecontracteerd</span>
								{/if}
							</button>
						{/each}
						</div>
						<div class="buy-ap-section">
							<Tooltip position="top">
								{#snippet children()}
								<button class="btn-buy-ap"
									onclick={() => doAction({ type: 'BUY_ACTION_POINT' })}
									disabled={!player || player.cash < BUY_ACTION_POINT_COST}>
									&#x26A1; Koop Extra Actiepunt — {BUY_ACTION_POINT_COST} cash
								</button>
								{/snippet}
								{#snippet content()}<span class="tt-label">Extra Actiepunt</span>Koop 1 extra actiepunt voor <strong>{BUY_ACTION_POINT_COST} cash</strong>. Handig als je meer acties wilt uitvoeren deze beurt. Max 1 per beurt.{/snippet}
							</Tooltip>
						</div>
					</div>
				{/if}

			{#if showExpand}
				<div class="shop-panel card">
					<h3>&#x1F30D; Uitbreiden naar continent</h3>
					<div class="shop-grid">
						{#each Object.entries(CONTINENT_CONFIG) as [id, config]}
							<button class="shop-item"
								onclick={() => doAction({ type: 'EXPAND_REGION', continent: id as Continent })}
								disabled={player?.continents[id as Continent].unlocked}>
								<div class="shop-name" style="color: {CONTINENT_COLORS[id]}">{config.name}</div>
								<div class="shop-desc">{config.description}</div>
								<div class="shop-regulation">{config.regulation}</div>
								{#if player?.continents[id as Continent].unlocked}
									{@const cs = player.continents[id as Continent]}
									<span class="badge badge-success">Ontgrendeld</span>
									<div class="shop-compliance-info">
										<span class="shop-compliance-score" class:compliance-ok={cs.complianceScore >= config.baseCompliance} class:compliance-low={cs.complianceScore < config.baseCompliance}>&#x1F4CB; Score: {cs.complianceScore} / {config.baseCompliance}</span>
										{#if cs.complianceFailures > 0}
											<span class="shop-compliance-failures" class:compliance-danger={cs.complianceFailures >= 2}>&#x26A0;&#xFE0F; Fouten: {cs.complianceFailures}/3</span>
										{/if}
									</div>
								{:else}
									<Tooltip position="top">
										{#snippet children()}<span class="shop-cost">&#x1F4B0; 25 cash</span>{/snippet}
										{#snippet content()}<span class="tt-label">Uitbreidingskost</span>Eenmalige investering om dit continent te ontgrendelen. Hierna kun je opdrachten uitvoeren en leveranciers contracteren in <strong>{config.name}</strong>.{/snippet}
									</Tooltip>
								{/if}
							</button>
						{/each}
					</div>
				</div>
			{/if}

			{#if showTrainModal && trainTargetId}
				{@const trainH = player?.humanoids.find(h => h.id === trainTargetId)}
				{#if trainH}
					{@const trainGain = Math.round(8 * TRAINING_MULTIPLIER[trainH.card.type])}
					{@const trainCostModal = TRAINING_COST[trainH.card.type]}
					<div class="shop-panel card">
						<h3>&#x1F393; Training voor {trainH.card.name} ({trainCostModal} cash)</h3>
						<p class="modal-desc">Kies een sector om te trainen. De resource is <strong>1 beurt niet inzetbaar</strong> en krijgt daarna <strong>+{trainGain}</strong> skill.
							{#if trainH.card.type === 'robot'}
								<span class="type-hint type-hint-robot">&#x1F680; Robots leren snel!</span>
							{:else}
								<span class="type-hint type-hint-human">&#x1F464; Mensen leren minder bij.</span>
							{/if}
						</p>
						<div class="modal-info-row">
							<Tooltip position="top">
								{#snippet children()}<span class="modal-info-item">&#x1F4B0; Kost: {trainCostModal} cash</span>{/snippet}
								{#snippet content()}<span class="tt-label">Trainingskost</span>{trainH.card.type === 'robot' ? 'Robots kosten meer om te trainen (25 cash) maar leren veel sneller' : 'Mensen zijn goedkoper om te trainen (15 cash) maar leren minder bij'}{/snippet}
							</Tooltip>
							<Tooltip position="top">
								{#snippet children()}<span class="modal-info-item">&#x23F3; 1 beurt wachten</span>{/snippet}
								{#snippet content()}<span class="tt-label">Beschikbaarheid</span>De resource is <strong>1 beurt niet inzetbaar</strong> voor opdrachten. Aan het einde van de volgende beurt is de training klaar{/snippet}
							</Tooltip>
							<Tooltip position="top">
								{#snippet children()}<span class="modal-info-item">&#x1F4C8; +{trainGain} skill</span>{/snippet}
								{#snippet content()}<span class="tt-label">Skill-groei</span>{trainH.card.type === 'robot' ? `Robots krijgen +${trainGain} skill (8 × 2.0 multiplier)` : `Mensen krijgen +${trainGain} skill (8 × 0.5 multiplier)`}. Training verhoogt ook het trainingslevel (+5 bonus op alle opdrachten){/snippet}
							</Tooltip>
							{#if trainH.card.type === 'robot'}
								<Tooltip position="top">
									{#snippet children()}<span class="modal-info-item">&#x1F6E1;&#xFE0F; +15 veiligheid</span>{/snippet}
									{#snippet content()}<span class="tt-label">Veiligheidsbonus</span>Elke training verhoogt de veiligheid van robots met <strong>+15</strong>. Hogere veiligheid verbetert je <strong>Veiligheid</strong>-score in de Impact Score{/snippet}
								</Tooltip>
							{/if}
						</div>
						<div class="shop-grid">
							{#each Object.entries(trainH.card.skills) as [sector, level]}
								{@const s = sector as Sector}
								{@const bonus = SECTOR_TYPE_BONUS[s]}
								{@const hasBonus = bonus.preferred === trainH.card.type}
								<Tooltip position="top">
									{#snippet children()}
									<button class="shop-item sector-choice"
										onclick={() => { doAction({ type: 'TRAIN_HUMANOID', playerHumanoidId: trainTargetId!, sector: s }); showTrainModal = false; trainTargetId = null; }}>
										<div class="shop-name" class:shop-skill-bonus={hasBonus}>{SECTOR_LABELS[s]} {#if hasBonus}<span class="sector-star">&#x2B50;</span>{/if}</div>
										<div class="sector-current">Huidig: <strong>{level}</strong></div>
										<div class="sector-after">Na training: <strong>{Math.min(100, level + trainGain)}</strong> <span class="sector-gain">+{trainGain}</span></div>
									</button>
									{/snippet}
									{#snippet content()}
										<span class="tt-label">{SECTOR_LABELS[s]} training</span>
										<div class="tt-row"><span>Huidige skill</span><span class="tt-value">{level}</span></div>
										<div class="tt-row"><span>Na training</span><span class="tt-positive">{Math.min(100, level + trainGain)}</span></div>
										{#if hasBonus}
											<div class="tt-divider"></div>
											<div class="tt-positive">{bonus.label}: +{bonus.bonus} extra op {SECTOR_LABELS[s]}-opdrachten</div>
										{/if}
										{#if level + trainGain >= 100}
											<div class="tt-divider"></div>
											<div class="tt-negative">Let op: skill is al (bijna) maximaal — training levert minder op</div>
										{/if}
									{/snippet}
								</Tooltip>
							{/each}
						</div>
						<button class="btn-outline modal-cancel" onclick={() => { showTrainModal = false; trainTargetId = null; }}>Annuleren</button>
					</div>
				{/if}
			{/if}

			{#if showUpgradeModal && upgradeTargetId}
				{@const upH = player?.humanoids.find(h => h.id === upgradeTargetId)}
				{#if upH}
					{@const upGain = Math.round(10 * UPGRADE_MULTIPLIER[upH.card.type])}
					<div class="shop-panel card">
						<h3>&#x2B06;&#xFE0F; Upgrade voor {upH.card.name}</h3>
						<p class="modal-desc">Kies een sector om te upgraden (<strong>+{upGain}</strong> skill). Conditie wordt ook hersteld (+30).
							{#if upH.card.type === 'robot'}
								<span class="type-hint type-hint-robot">&#x1F680; Robots upgraden sterk!</span>
							{:else}
								<span class="type-hint type-hint-human">&#x1F464; Mensen upgraden minder.</span>
							{/if}
						</p>
						<div class="modal-info-row">
							<Tooltip position="top">
								{#snippet children()}<span class="modal-info-item">&#x1F4B0; Kost: 20 cash</span>{/snippet}
								{#snippet content()}<span class="tt-label">Upgradekost</span>Vaste prijs van <strong>20 cash</strong> ongeacht type (mens of robot){/snippet}
							</Tooltip>
							<Tooltip position="top">
								{#snippet children()}<span class="modal-info-item">&#x26A1; Direct effect</span>{/snippet}
								{#snippet content()}<span class="tt-label">Geen wachttijd</span>In tegenstelling tot training is een upgrade <strong>direct</strong> actief — de resource blijft inzetbaar{/snippet}
							</Tooltip>
							<Tooltip position="top">
								{#snippet children()}<span class="modal-info-item">&#x1F4C8; +{upGain} skill</span>{/snippet}
								{#snippet content()}<span class="tt-label">Skill-groei</span>{upH.card.type === 'robot' ? `Robots krijgen +${upGain} skill (10 × 2.0 multiplier)` : `Mensen krijgen +${upGain} skill (10 × 0.5 multiplier)`}{/snippet}
							</Tooltip>
							<Tooltip position="top">
								{#snippet children()}<span class="modal-info-item">&#x2764;&#xFE0F; +30% conditie</span>{/snippet}
								{#snippet content()}<span class="tt-label">Conditieherstel</span>Herstelt <strong>+30%</strong> conditie. Huidige conditie: <strong>{upH.condition}%</strong> → <strong class="tt-positive">{Math.min(100, upH.condition + 30)}%</strong>. Conditie onder 50% geeft strafpunten op opdrachten{/snippet}
							</Tooltip>
							{#if upH.card.type === 'robot'}
								<Tooltip position="top">
									{#snippet children()}<span class="modal-info-item">&#x1F6E1;&#xFE0F; +10 veiligheid</span>{/snippet}
									{#snippet content()}<span class="tt-label">Veiligheidsbonus</span>Elke upgrade verhoogt de veiligheid van robots met <strong>+10</strong>. Huidige veiligheid: <strong>{upH.safety}</strong> → <strong class="tt-positive">{Math.min(100, upH.safety + 10)}</strong>{/snippet}
								</Tooltip>
							{/if}
						</div>
						<div class="shop-grid">
							{#each Object.entries(upH.card.skills) as [sector, level]}
								{@const s = sector as Sector}
								{@const bonus = SECTOR_TYPE_BONUS[s]}
								{@const hasBonus = bonus.preferred === upH.card.type}
								<Tooltip position="top">
									{#snippet children()}
									<button class="shop-item sector-choice"
										onclick={() => { doAction({ type: 'UPGRADE_HUMANOID', playerHumanoidId: upgradeTargetId!, sector: s }); showUpgradeModal = false; upgradeTargetId = null; }}>
										<div class="shop-name" class:shop-skill-bonus={hasBonus}>{SECTOR_LABELS[s]} {#if hasBonus}<span class="sector-star">&#x2B50;</span>{/if}</div>
										<div class="sector-current">Huidig: <strong>{level}</strong></div>
										<div class="sector-after">Na upgrade: <strong>{Math.min(100, level + upGain)}</strong> <span class="sector-gain">+{upGain}</span></div>
									</button>
									{/snippet}
									{#snippet content()}
										<span class="tt-label">{SECTOR_LABELS[s]} upgrade</span>
										<div class="tt-row"><span>Huidige skill</span><span class="tt-value">{level}</span></div>
										<div class="tt-row"><span>Na upgrade</span><span class="tt-positive">{Math.min(100, level + upGain)}</span></div>
										{#if hasBonus}
											<div class="tt-divider"></div>
											<div class="tt-positive">{bonus.label}: +{bonus.bonus} extra op {SECTOR_LABELS[s]}-opdrachten</div>
										{/if}
										{#if level + upGain >= 100}
											<div class="tt-divider"></div>
											<div class="tt-negative">Let op: skill is al (bijna) maximaal — upgrade levert minder op</div>
										{/if}
									{/snippet}
								</Tooltip>
							{/each}
						</div>
						<button class="btn-outline modal-cancel" onclick={() => { showUpgradeModal = false; upgradeTargetId = null; }}>Annuleren</button>
					</div>
				{/if}
			{/if}

		</footer>
	</div>

	{#if showGameLog}
		<div class="log-overlay" onclick={() => showGameLog = false} role="presentation">
			<div class="log-modal card" onclick={(e) => e.stopPropagation()} role="dialog">
				<div class="log-modal-header">
					<h3>Spellog</h3>
					<button class="btn-outline btn-sm" onclick={() => showGameLog = false}>Sluiten</button>
				</div>
				<div class="log-modal-scroll">
					{#each state.eventLog.slice().reverse() as entry}
						<div class="log-entry log-{entry.type}">
							<span class="log-round">R{entry.round}</span>
							{entry.message}
						</div>
					{/each}
					{#if state.eventLog.length === 0}
						<p class="empty-msg">Nog geen gebeurtenissen.</p>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	{#if $tutorialActive && $currentTutorialStep}
		{@const step = $currentTutorialStep}
		<div class="tutorial-overlay">
			<div class="tutorial-card {getTutorialPositionClass(step.position)}">
				<div class="tutorial-header">
					<span class="tutorial-step-badge">Tutorial</span>
					<h3>{step.title}</h3>
				</div>
				<p>{step.message}</p>
				<div class="tutorial-actions">
					{#if step.action}
						<span class="tutorial-hint">Voer de beschreven actie uit om verder te gaan</span>
					{:else}
						<button class="btn-primary" onclick={handleTutorialNext}>
							{step.id === 'done' ? 'Start het echte spel!' : 'Volgende'}
						</button>
					{/if}
					{#if step.id !== 'done'}
						<button class="btn-outline tutorial-skip" onclick={handleSkipTutorial}>
							Tutorial overslaan
						</button>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	{#if showJobResultPopup && jobResultsDisplay.length > 0}
		<div class="log-overlay" role="presentation">
			<div class="jobresult-modal card" onclick={(e) => e.stopPropagation()} role="dialog">
				<div class="jobresult-header">
					<h3>Opdracht Resultaten</h3>
				</div>
				{#each jobResultsDisplay as jr, i}
					<div class="jobresult-entry" class:jobresult-success={jr.actionSuccess && jr.result.outcome === 'success'} class:jobresult-partial={jr.actionSuccess && jr.result.outcome === 'partial'} class:jobresult-failed={jr.actionSuccess && jr.result.outcome === 'failed'} class:jobresult-error={!jr.actionSuccess}>
						<div class="jobresult-title-row">
							<span class="jobresult-job-name">"{jr.jobTitle}"</span>
							<span class="badge badge-info">{SECTOR_LABELS[jr.jobSector]}</span>
						</div>
						<div class="jobresult-humanoid">
							{jr.humanoidType === 'robot' ? '\u{1F916}' : '\u{1F464}'} {jr.humanoidName}
						</div>

						{#if !jr.actionSuccess}
							<div class="jobresult-error-msg">
								&#x26A0;&#xFE0F; {jr.errorMessage}
							</div>
						{:else}
							{@const bd = jr.result.breakdown}
							<div class="jobresult-breakdown">
								<Tooltip position="right">
									{#snippet children()}
									<div class="jobresult-score-row jr-hoverable">
										<span>&#x1F3AF; Skill ({SECTOR_LABELS[jr.jobSector]})</span>
										<span class="jr-positive">+{bd.skillScore}</span>
									</div>
									{/snippet}
									{#snippet content()}<span class="tt-label">Sector-skill</span>De {SECTOR_LABELS[jr.jobSector]}-skill van {jr.humanoidName}. Hoe hoger de skill in de gevraagde sector, hoe beter de match. Verhoog via <strong>training</strong> of <strong>upgrade</strong>.{/snippet}
								</Tooltip>
								<Tooltip position="right">
									{#snippet children()}
									<div class="jobresult-score-row jr-hoverable">
										<span>&#x1F527; Betrouwbaarheid</span>
										<span class="jr-positive">+{bd.reliabilityScore}</span>
									</div>
									{/snippet}
									{#snippet content()}<span class="tt-label">Betrouwbaarheid</span>30% van de betrouwbaarheidsscore van je resource. Dit is een vast kenmerk per humanoid en kan niet worden verhoogd.{/snippet}
								</Tooltip>
								{#if bd.trainingBonus > 0}
									<Tooltip position="right">
										{#snippet children()}
										<div class="jobresult-score-row jr-hoverable">
											<span>&#x1F393; Training</span>
											<span class="jr-positive">+{bd.trainingBonus}</span>
										</div>
										{/snippet}
										{#snippet content()}<span class="tt-label">Trainingsbonus</span><strong>+5 per trainingslevel</strong>. {jr.humanoidName} heeft level {bd.trainingBonus / 5}. Elke training verhoogt het level met 1.{/snippet}
									</Tooltip>
								{/if}
								{#if bd.supplierBonus > 0}
									<Tooltip position="right">
										{#snippet children()}
										<div class="jobresult-score-row jr-hoverable">
											<span>&#x1F3ED; Leverancier</span>
											<span class="jr-positive">+{bd.supplierBonus}</span>
										</div>
										{/snippet}
										{#snippet content()}<span class="tt-label">Leveranciersbonus</span>Permanente bonus van gecontracteerde leveranciers die de <strong>{SECTOR_LABELS[jr.jobSector]}</strong>-sector versterken.{/snippet}
									</Tooltip>
								{/if}
								{#if bd.typeBonus > 0}
									<Tooltip position="right">
										{#snippet children()}
										<div class="jobresult-score-row jr-hoverable">
											<span>{jr.humanoidType === 'robot' ? '\u{26A1}' : '\u{2764}\u{FE0F}'} {bd.typeBonusLabel}</span>
											<span class="jr-positive">+{bd.typeBonus}</span>
										</div>
										{/snippet}
										{#snippet content()}<span class="tt-label">Type-voordeel</span>{jr.humanoidType === 'robot' ? 'Robots' : 'Mensen'} zijn van nature beter in <strong>{SECTOR_LABELS[jr.jobSector]}</strong>. Dit geeft een vaste bonus op alle opdrachten in deze sector.{/snippet}
									</Tooltip>
								{/if}
								{#if bd.complianceModifier !== 0}
									<Tooltip position="right">
										{#snippet children()}
										<div class="jobresult-score-row jr-hoverable">
											<span>&#x1F4CB; Compliance</span>
											<span class={bd.complianceModifier > 0 ? 'jr-positive' : 'jr-negative'}>{bd.complianceModifier > 0 ? '+' : ''}{bd.complianceModifier}</span>
										</div>
										{/snippet}
										{#snippet content()}<span class="tt-label">Compliance-verschil</span>Het verschil tussen jouw compliance-score en de opdrachteis, ×0.1. {#if bd.complianceModifier < 0}<span class="tt-negative">Je compliance is te laag — doe een <strong>Compliance Check</strong> (+15) om dit te verbeteren.</span>{:else}<span class="tt-positive">Je compliance is hoger dan de eis — bonus!</span>{/if}{/snippet}
									</Tooltip>
								{/if}
								<Tooltip position="right">
									{#snippet children()}
									<div class="jobresult-score-row jr-hoverable">
										<span>&#x26A0;&#xFE0F; Risico</span>
										<span class="jr-negative">-{bd.riskPenalty}</span>
									</div>
									{/snippet}
									{#snippet content()}<span class="tt-label">Opdrachtrisico</span>Vast risico van deze opdracht. Hoe hoger het risico, hoe moeilijker. Dit kun je niet beïnvloeden — kies opdrachten met lager risico als je score te laag is.{/snippet}
								</Tooltip>
								{#if bd.conditionPenalty > 0}
									<Tooltip position="right">
										{#snippet children()}
										<div class="jobresult-score-row jr-hoverable">
											<span>&#x1F4A5; Conditie-straf</span>
											<span class="jr-negative">-{bd.conditionPenalty}</span>
										</div>
										{/snippet}
										{#snippet content()}<span class="tt-label">Conditie-straf</span>Als de conditie onder <strong>50%</strong> zakt, krijg je strafpunten: (50 - conditie) × 0.3. Gebruik een <strong>Upgrade</strong> om +30% conditie te herstellen.{/snippet}
									</Tooltip>
								{/if}

								<div class="jobresult-divider"></div>

								<div class="jobresult-score-row jobresult-base">
									<span>Basis score</span>
									<span>{bd.baseScore}</span>
								</div>

								<Tooltip position="right">
									{#snippet children()}
									<div class="jobresult-score-row jobresult-final jr-hoverable">
										<span>Eindscore</span>
										<span class="jobresult-final-value">{Math.round(jr.result.finalScore)}</span>
									</div>
									{/snippet}
									{#snippet content()}
										<span class="tt-label">Eindscore</span>
										<div class="tt-divider"></div>
										<div class="tt-row"><span>70+</span><span class="tt-positive">Succes — volle beloning</span></div>
										<div class="tt-row"><span>50-69</span><span>Gedeeltelijk — halve beloning</span></div>
										<div class="tt-row"><span>&lt;50</span><span class="tt-negative">Mislukt — cash en reputatie verlies</span></div>
									{/snippet}
								</Tooltip>
							</div>

							<div class="jobresult-outcome" class:outcome-success={jr.result.outcome === 'success'} class:outcome-partial={jr.result.outcome === 'partial'} class:outcome-failed={jr.result.outcome === 'failed'}>
								{#if jr.result.outcome === 'success'}
									<div class="outcome-icon">&#x2705;</div>
									<div class="outcome-text">
										<strong>Succes!</strong>
										<span class="outcome-rewards">
											<span class="jr-positive">+{jr.jobReward} cash</span>
											<span class="jr-positive">+{jr.jobRepReward} reputatie</span>
										</span>
									</div>
								{:else if jr.result.outcome === 'partial'}
									<div class="outcome-icon">&#x26A0;&#xFE0F;</div>
									<div class="outcome-text">
										<strong>Gedeeltelijk</strong>
										<span class="outcome-rewards">
											<span class="jr-positive">+{Math.floor(jr.jobReward * 0.5)} cash</span>
											<span class="jr-positive">+1 reputatie</span>
										</span>
									</div>
								{:else}
									<div class="outcome-icon">&#x274C;</div>
									<div class="outcome-text">
										<strong>Mislukt</strong>
										<span class="outcome-rewards">
											<span class="jr-negative">-10 cash</span>
											<span class="jr-negative">-5 reputatie</span>
										</span>
									</div>
								{/if}
							</div>
						{/if}
					</div>
					{#if i < jobResultsDisplay.length - 1}
						<div class="jobresult-separator"></div>
					{/if}
				{/each}
				<div class="jobresult-actions">
					<button class="btn-primary" onclick={dismissJobResults}>
						{pendingEndTurnAfterResults ? 'Verder naar beurt samenvatting' : 'OK'}
					</button>
				</div>
			</div>
		</div>
	{/if}

	{#if showEndTurnPopup && endTurnStartState && endTurnPreviewState && endTurnStartImpact && endTurnPreviewImpact}
		{@const cur = endTurnStartState}
		{@const nxt = endTurnPreviewState}
		{@const curImp = endTurnStartImpact}
		{@const nxtImp = endTurnPreviewImpact}
		{@const maintenanceCost = nxt.humanoids.reduce((s, h) => s + h.card.maintenanceCost, 0)}
		{@const newHumanoids = nxt.humanoids.filter(h => !cur.humanoids.some(ch => ch.id === h.id))}
		{@const cashSpentOnActions = calcCashSpentOnActions(cur, nxt)}
		{@const cashFromJobs = (nxt.cash - cur.cash) + maintenanceCost + cashSpentOnActions}
		{@const jobsDone = nxt.successfulJobs - cur.successfulJobs}
		{@const partialJobs = nxt.jobsScored - cur.jobsScored - (nxt.successfulJobs - cur.successfulJobs) - (nxt.failedJobs - cur.failedJobs)}
		{@const failedJobsDone = nxt.failedJobs - cur.failedJobs}
		{@const repFromJobs = nxt.reputation - cur.reputation}
		<div class="log-overlay" onclick={cancelEndTurn} role="presentation">
			<div class="endturn-modal card" onclick={(e) => e.stopPropagation()} role="dialog">
				<div class="endturn-header">
					<h3>Beurt samenvatting — {cur.name}</h3>
				</div>
				<div class="endturn-table">
					<div class="endturn-row endturn-row-header">
						<div class="endturn-label-col"></div>
						<div class="endturn-cur-col">Huidig</div>
						<div class="endturn-arrow-col"></div>
						<div class="endturn-new-col">Nieuw</div>
					</div>

					<div class="endturn-row">
						<div class="endturn-label-col">&#x1F4B0; Geld</div>
						<div class="endturn-cur-col">{cur.cash}</div>
						<div class="endturn-arrow-col">
							{#if nxt.cash - cur.cash !== 0}
								<span class={nxt.cash - cur.cash > 0 ? 'endturn-pos' : 'endturn-neg'}>{nxt.cash - cur.cash > 0 ? '+' : ''}{nxt.cash - cur.cash}</span>
							{:else}
								<span class="endturn-neutral">—</span>
							{/if}
						</div>
						<div class="endturn-new-col endturn-new">{nxt.cash}</div>
					</div>
					<div class="endturn-explain">
						{#if cashFromJobs > 0}
							<span class="endturn-pos">+{cashFromJobs} uit opdrachten</span>
						{:else if cashFromJobs < 0}
							<span class="endturn-neg">{cashFromJobs} uit mislukte opdrachten</span>
						{/if}
						{#if cashSpentOnActions > 0}
							<span class="endturn-neg">-{cashSpentOnActions} aankopen</span>
							<span class="endturn-explain-sub">
								({#each newHumanoids as h, i}{#if i > 0}, {/if}{h.card.name} -{h.card.cost}{/each}{#each nxt.suppliers.filter(s => !cur.suppliers.some(cs => cs.id === s.id)) as sup, i}{#if i > 0 || newHumanoids.length > 0}, {/if}{sup.name}{/each})
							</span>
						{/if}
						{#if maintenanceCost > 0}
							<span class="endturn-neg">-{maintenanceCost} onderhoud</span>
							<span class="endturn-explain-sub">
								({#each nxt.humanoids as h, i}{#if i > 0}, {/if}{h.card.name} -{h.card.maintenanceCost}{/each})
							</span>
						{/if}
					</div>

					<div class="endturn-row">
						<div class="endturn-label-col">&#x2B50; Totale reputatie</div>
						<div class="endturn-cur-col">{cur.reputation}</div>
						<div class="endturn-arrow-col">
							{#if repFromJobs !== 0}
								<span class={repFromJobs > 0 ? 'endturn-pos' : 'endturn-neg'}>{repFromJobs > 0 ? '+' : ''}{repFromJobs}</span>
							{:else}
								<span class="endturn-neutral">—</span>
							{/if}
						</div>
						<div class="endturn-new-col endturn-new">{nxt.reputation}</div>
					</div>
					<div class="endturn-explain">
						{#if jobsDone > 0}
							<span class="endturn-pos">+reputatie uit {jobsDone} geslaagde opdracht{jobsDone > 1 ? 'en' : ''}</span>
						{/if}
						{#if partialJobs > 0}
							<span class="endturn-neutral-text">+1 per gedeeltelijke opdracht ({partialJobs}x)</span>
						{/if}
						{#if failedJobsDone > 0}
							<span class="endturn-neg">-5 per mislukte opdracht ({failedJobsDone}x)</span>
						{/if}
						{#if repFromJobs === 0 && jobsDone === 0}
							<span class="endturn-neutral-text">Geen opdrachten uitgevoerd deze beurt</span>
						{/if}
					</div>

					<div class="endturn-row">
						<div class="endturn-label-col">&#x1F916; Resources</div>
						<div class="endturn-cur-col">{cur.humanoids.length}</div>
						<div class="endturn-arrow-col">
							{#if nxt.humanoids.length - cur.humanoids.length !== 0}
								<span class={nxt.humanoids.length - cur.humanoids.length > 0 ? 'endturn-pos' : 'endturn-neg'}>{nxt.humanoids.length - cur.humanoids.length > 0 ? '+' : ''}{nxt.humanoids.length - cur.humanoids.length}</span>
							{:else}
								<span class="endturn-neutral">—</span>
							{/if}
						</div>
						<div class="endturn-new-col endturn-new">{nxt.humanoids.length}</div>
					</div>
					<div class="endturn-explain">
						{#if newHumanoids.length > 0}
							<span class="endturn-pos">Gekocht: {newHumanoids.map(h => h.card.name).join(', ')}</span>
						{:else}
							<span class="endturn-neutral-text">Geen nieuwe resources gekocht</span>
						{/if}
					</div>

					<div class="endturn-row">
						<div class="endturn-label-col">&#x2705; Gelukte opdrachten</div>
						<div class="endturn-cur-col">{cur.successfulJobs}</div>
						<div class="endturn-arrow-col">
							{#if jobsDone > 0}
								<span class="endturn-pos">+{jobsDone}</span>
							{:else}
								<span class="endturn-neutral">—</span>
							{/if}
						</div>
						<div class="endturn-new-col endturn-new">{nxt.successfulJobs}</div>
					</div>
					<div class="endturn-explain">
						{#if jobsDone > 0}
							<span class="endturn-pos">{jobsDone} opdracht{jobsDone > 1 ? 'en' : ''} succesvol afgerond</span>
						{/if}
						{#if partialJobs > 0}
							<span class="endturn-neutral-text">{partialJobs} gedeeltelijk (telt niet als geslaagd)</span>
						{/if}
						{#if failedJobsDone > 0}
							<span class="endturn-neg">{failedJobsDone} mislukt</span>
						{/if}
						{#if jobsDone === 0 && partialJobs <= 0 && failedJobsDone === 0}
							<span class="endturn-neutral-text">Geen opdrachten uitgevoerd</span>
						{/if}
					</div>

					<div class="endturn-row">
						<div class="endturn-label-col">&#x1F3C6; Impact Score</div>
						<div class="endturn-cur-col">{curImp.total}</div>
						<div class="endturn-arrow-col">
							{#if nxtImp.total - curImp.total !== 0}
								<span class={nxtImp.total - curImp.total > 0 ? 'endturn-pos' : 'endturn-neg'}>{nxtImp.total - curImp.total > 0 ? '+' : ''}{nxtImp.total - curImp.total}</span>
							{:else}
								<span class="endturn-neutral">—</span>
							{/if}
						</div>
						<div class="endturn-new-col endturn-new">{nxtImp.total}</div>
					</div>
				</div>

				<div class="endturn-impact-detail">
					<div class="endturn-detail-title">Impact Score Detail</div>
					<div class="endturn-detail-grid">
						<div class="endturn-detail-header"></div>
						<div class="endturn-detail-header">Huidig</div>
						<div class="endturn-detail-header">Verandering</div>
						<div class="endturn-detail-header">Nieuw</div>
						{#each [
							{ icon: '\u{1F4B0}', label: 'Winst', cur: curImp.winst, nxt: nxtImp.winst, explain: `Gebaseerd op cash (${nxt.cash} / 8)` },
							{ icon: '\u{1F4A1}', label: 'Innovatie', cur: curImp.innovatie, nxt: nxtImp.innovatie, explain: `${nxt.trainingsCompleted} trainingen + ${nxt.upgradesCompleted} upgrades` },
							{ icon: '\u{1F91D}', label: 'Vertrouwen', cur: curImp.vertrouwen, nxt: nxtImp.vertrouwen, explain: `Reputatie ${nxt.reputation} + ${nxt.successfulJobs} geslaagde jobs` },
							{ icon: '\u{1F6E1}\u{FE0F}', label: 'Veiligheid', cur: curImp.veiligheid, nxt: nxtImp.veiligheid, explain: `Gem. veiligheid van je resources` },
							{ icon: '\u{1F30D}', label: 'Duurzaamheid', cur: curImp.duurzaamheid, nxt: nxtImp.duurzaamheid, explain: `Continenten ontgrendeld - reizen` },
							{ icon: '\u{2699}\u{FE0F}', label: 'Complexiteit', cur: curImp.complexiteit, nxt: nxtImp.complexiteit, explain: `Straf voor ${nxt.humanoids.length} resources` },
						] as row}
							<div class="endturn-detail-label">{row.icon} {row.label}</div>
							<div class="endturn-detail-val">{row.cur}</div>
							<div class="endturn-detail-val">
								{#if row.nxt !== row.cur}
									<span class={row.nxt > row.cur ? 'endturn-pos' : 'endturn-neg'}>
										{row.nxt > row.cur ? '+' : ''}{row.nxt - row.cur}
									</span>
								{:else}
									<span class="endturn-neutral">—</span>
								{/if}
							</div>
							<div class="endturn-detail-val endturn-new">{row.nxt}</div>
							<div class="endturn-detail-explain">{row.explain}</div>
						{/each}
					</div>
				</div>

				<div class="endturn-actions">
					<button class="btn-outline" onclick={cancelEndTurn}>Annuleren</button>
					<button class="btn-primary" onclick={confirmEndTurn}>Akkoord</button>
				</div>
			</div>
		</div>
	{/if}

	{#if showPodiumPopup && (state.status === 'won' || state.status === 'lost')}
		{@const sortedPlayers = [...state.players].sort((a, b) => {
			const scoreA = calculatePlayerImpactScore(a, state.maxRounds).total;
			const scoreB = calculatePlayerImpactScore(b, state.maxRounds).total;
			return scoreB - scoreA;
		})}
		<div class="log-overlay" role="presentation">
			<div class="podium-modal card" role="dialog">
				<h2 class="podium-title">Eindstand</h2>
				<div class="podium-stage">
					{#each sortedPlayers as p, rank}
						{@const impact = calculatePlayerImpactScore(p, state.maxRounds)}
						{@const goals = [p.cash > 0, p.reputation >= 50, p.successfulJobs >= 6]}
						{@const goalsCount = goals.filter(Boolean).length}
						<div class="podium-entry" class:podium-1={rank === 0} class:podium-2={rank === 1} class:podium-3={rank === 2} class:podium-off={rank >= 3}>
							<div class="podium-rank">
								{#if rank === 0}
									<span class="podium-medal">&#x1F947;</span>
								{:else if rank === 1}
									<span class="podium-medal">&#x1F948;</span>
								{:else if rank === 2}
									<span class="podium-medal">&#x1F949;</span>
								{:else}
									<span class="podium-medal-none">#{rank + 1}</span>
								{/if}
							</div>
							<div class="podium-bar" style="height: {Math.max(30, 120 - rank * 30)}px; background: {p.color}20; border: 2px solid {p.color};">
								<div class="podium-player-name" style="color: {p.color}">{p.name}</div>
								<Tooltip position="top">
									{#snippet children()}<div class="podium-score">{impact.total} punten</div>{/snippet}
									{#snippet content()}
										<span class="tt-label">Impact Score</span>
										<div class="tt-row"><span>Winst</span><span class="tt-value">{impact.winst}/25</span></div>
										<div class="tt-row"><span>Innovatie</span><span class="tt-value">{impact.innovatie}/25</span></div>
										<div class="tt-row"><span>Vertrouwen</span><span class="tt-value">{impact.vertrouwen}/25</span></div>
										<div class="tt-row"><span>Veiligheid</span><span class="tt-value">{impact.veiligheid}/25</span></div>
										<div class="tt-row"><span>Duurzaamheid</span><span class="tt-value">{impact.duurzaamheid}/25</span></div>
										<div class="tt-row"><span>Complexiteit</span><span class="tt-value">{impact.complexiteit}</span></div>
										<div class="tt-divider"></div>
										<div class="tt-row"><span><strong>Totaal</strong></span><span class="tt-value"><strong>{impact.total}</strong></span></div>
									{/snippet}
								</Tooltip>
							</div>
							<div class="podium-details">
								<Tooltip text="Resterend geld — doel: meer dan 0" position="top">
									{#snippet children()}<span>&#x1F4B0; {p.cash}</span>{/snippet}
								</Tooltip>
								<Tooltip text="Totale reputatie — doel: minstens 50" position="top">
									{#snippet children()}<span>&#x2B50; {p.reputation}</span>{/snippet}
								</Tooltip>
								<Tooltip text="Succesvolle opdrachten — doel: minstens 6" position="top">
									{#snippet children()}<span>&#x2705; {p.successfulJobs} opdrachten</span>{/snippet}
								</Tooltip>
								<Tooltip position="top">
									{#snippet children()}
									<span class={goalsCount >= 2 ? 'podium-win' : 'podium-lose'}>
										{goalsCount}/3 doelen {goalsCount >= 2 ? 'behaald' : ''}
									</span>
									{/snippet}
									{#snippet content()}
										<span class="tt-label">Wincondities (2 van 3 nodig)</span>
										<div class="tt-row"><span>Cash &gt; 0</span><span class={p.cash > 0 ? 'tt-positive' : 'tt-negative'}>{p.cash > 0 ? 'Behaald' : 'Niet behaald'}</span></div>
										<div class="tt-row"><span>Reputatie &ge; 50</span><span class={p.reputation >= 50 ? 'tt-positive' : 'tt-negative'}>{p.reputation >= 50 ? 'Behaald' : 'Niet behaald'}</span></div>
										<div class="tt-row"><span>6+ opdrachten</span><span class={p.successfulJobs >= 6 ? 'tt-positive' : 'tt-negative'}>{p.successfulJobs >= 6 ? 'Behaald' : 'Niet behaald'}</span></div>
									{/snippet}
								</Tooltip>
							</div>
						</div>
					{/each}
				</div>
				<div class="podium-actions">
					<button class="btn-primary btn-lg" onclick={handleQuit}>Terug naar start</button>
				</div>
			</div>
		</div>
	{/if}
{/if}

<style>
	.game-layout {
		display: flex;
		flex-direction: column;
		height: 100vh;
		overflow: hidden;
		background: var(--color-bg);
	}

	/* ═══════════ TOP BAR / HUD ═══════════ */
	.top-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.45rem 1.25rem;
		background: linear-gradient(180deg, rgba(15, 29, 50, 0.98), rgba(10, 22, 40, 0.95));
		border-bottom: 1px solid var(--color-border);
		box-shadow: 0 2px 16px rgba(0, 0, 0, 0.35);
		z-index: 10;
		-webkit-backdrop-filter: blur(12px);
		backdrop-filter: blur(12px);
	}

	.game-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.header-logo {
		width: 34px;
		height: 34px;
		flex-shrink: 0;
		filter: drop-shadow(0 0 6px rgba(56, 189, 248, 0.3));
	}

	.game-title {
		font-family: var(--font-display);
		font-weight: 800;
		font-size: 1rem;
		color: var(--color-primary);
		letter-spacing: 0.06em;
		text-shadow: 0 0 16px rgba(56, 189, 248, 0.25);
	}

	.turn-info {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.btn-sm {
		font-size: 0.75rem;
		padding: 0.3rem 0.7rem;
	}

	/* ═══════════ MAIN AREA ═══════════ */
	.main-area {
		display: flex;
		flex: 1;
		overflow: hidden;
	}

	.sidebar {
		width: 300px;
		padding: 0.6rem;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		transition: box-shadow var(--transition);
		background: linear-gradient(180deg, rgba(10, 22, 40, 0.6), rgba(8, 16, 32, 0.8));
		scrollbar-width: thin;
		scrollbar-color: rgba(56, 189, 248, 0.15) transparent;
		z-index: 2;
		position: relative;
	}

	.left-sidebar {
		border-right: 1px solid var(--color-border);
	}

	.right-sidebar {
		border-left: 1px solid var(--color-border);
	}

	.sidebar .card {
		-webkit-backdrop-filter: none;
		backdrop-filter: none;
	}

	/* ═══════════ BOARD ═══════════ */
	.board-wrapper {
		flex: 1;
		position: relative;
		overflow: hidden;
		transition: box-shadow var(--transition);
	}

	.board-container {
		width: 100%;
		height: 100%;
		background: #071520;
	}

	.zoom-controls {
		position: absolute;
		top: 12px;
		right: 12px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 3px;
		z-index: 5;
	}

	.zoom-btn {
		width: 34px;
		height: 34px;
		border: 1px solid rgba(56, 189, 248, 0.2);
		border-radius: var(--radius-sm);
		background: rgba(15, 29, 50, 0.9);
		font-size: 1.1rem;
		font-weight: 700;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-primary);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
		transition: all var(--transition-fast);
		-webkit-backdrop-filter: blur(8px);
		backdrop-filter: blur(8px);
	}

	.zoom-btn:hover:not(:disabled) {
		background: rgba(56, 189, 248, 0.15);
		border-color: var(--color-primary);
		box-shadow: var(--shadow-glow-primary);
	}

	.zoom-btn:disabled {
		opacity: 0.25;
		cursor: default;
	}

	.zoom-reset {
		margin-top: 4px;
		font-size: 0.95rem;
	}

	.zoom-level {
		width: 34px;
		height: 22px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.7rem;
		font-weight: 700;
		color: var(--color-text-muted);
		background: rgba(15, 29, 50, 0.7);
		border-radius: 4px;
	}

	.map-legend {
		position: absolute;
		bottom: 12px;
		left: 12px;
		background: rgba(15, 29, 50, 0.92);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		padding: 0.6rem 0.85rem;
		font-size: 0.72rem;
		box-shadow: var(--shadow);
		pointer-events: auto;
		z-index: 5;
		-webkit-backdrop-filter: blur(12px);
		backdrop-filter: blur(12px);
	}

	.legend-title {
		font-family: var(--font-display);
		font-weight: 700;
		font-size: 0.65rem;
		margin-bottom: 0.4rem;
		color: var(--color-primary);
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.18rem 0;
	}

	.legend-locked {
		opacity: 0.35;
	}

	.legend-color {
		width: 10px;
		height: 10px;
		border-radius: 3px;
		flex-shrink: 0;
		box-shadow: 0 0 6px currentColor;
	}

	.legend-name {
		flex: 1;
		color: var(--color-text-light);
	}

	.map-legend :global(.tooltip-wrapper) {
		display: flex;
		width: 100%;
	}

	.legend-lock, .legend-check {
		font-size: 0.62rem;
	}

	.legend-compliance {
		font-size: 0.62rem;
		font-weight: 600;
		margin-left: auto;
	}

	.legend-failures {
		font-size: 0.58rem;
		margin-left: 0.2rem;
	}

	.legend-divider {
		height: 1px;
		background: var(--color-border);
		margin: 0.35rem 0;
	}

	.legend-hint {
		font-size: 0.6rem;
		color: var(--color-text-muted);
		margin-top: 0.35rem;
		font-style: italic;
	}

	.tutorial-highlight {
		box-shadow: inset 0 0 0 3px var(--color-accent), 0 0 24px var(--color-accent-glow);
		z-index: 5;
	}

	/* ═══════════ SIDEBAR HEADINGS ═══════════ */
	.sidebar h3 {
		font-family: var(--font-display);
		font-size: 0.68rem;
		text-transform: uppercase;
		color: var(--color-primary);
		margin-bottom: 0.5rem;
		letter-spacing: 0.08em;
	}

	/* ═══════════ JOB / HUMANOID CARDS ═══════════ */
	.job-item, .humanoid-item {
		display: block;
		width: 100%;
		text-align: left;
		padding: 0.65rem 0.7rem;
		margin-bottom: 0.35rem;
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius);
		background: var(--color-surface);
		transition: all var(--transition-fast);
	}

	.job-item:hover:not(.locked), .humanoid-item:hover:not(.in-training) {
		border-color: rgba(56, 189, 248, 0.35);
		background: var(--color-surface-elevated);
		box-shadow: var(--shadow-glow-primary);
	}

	.job-item.selected, .humanoid-item.selected {
		border-color: var(--color-primary);
		background: var(--color-primary-subtle);
		box-shadow: 0 0 0 2px var(--color-primary-glow), var(--shadow-glow-primary);
	}

	.job-item.drop-target {
		border-color: var(--color-success);
		background: var(--color-success-subtle);
		box-shadow: 0 0 0 3px var(--color-success-glow);
	}

	.job-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.job-explanation {
		font-size: 0.68rem;
		color: var(--color-text-muted);
		font-style: italic;
		line-height: 1.45;
		margin-bottom: 0.35rem;
	}

	.job-stat-item, .player-stat-item {
		cursor: help;
	}

	.job-title, .h-name {
		font-weight: 700;
		font-size: 0.82rem;
		margin-bottom: 0.25rem;
		color: var(--color-text);
	}

	.lock-icon {
		font-size: 0.72rem;
		opacity: 0.5;
	}

	.job-item.locked {
		opacity: 0.35;
		filter: grayscale(0.4);
	}

	.job-item.locked:hover {
		transform: none;
		box-shadow: none;
		border-color: var(--color-border);
		background: var(--color-surface);
	}

	.job-meta {
		display: flex;
		gap: 0.3rem;
		margin-bottom: 0.4rem;
		flex-wrap: wrap;
	}

	.continent-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.2rem;
		padding: 0.12rem 0.45rem;
		border-radius: var(--radius-pill);
		font-size: 0.62rem;
		font-weight: 700;
		letter-spacing: 0.02em;
	}

	.job-stats {
		display: flex;
		gap: 0.5rem;
		font-size: 0.7rem;
		color: var(--color-text-light);
	}

	.assign-inline-btn {
		flex: 1;
		font-size: 0.78rem;
		padding: 0.3rem 0.5rem;
	}

	.assign-row {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		margin-top: 0.4rem;
	}

	.assign-hint {
		font-size: 0.7rem;
		color: var(--color-primary);
		font-style: italic;
		margin-top: 0.45rem;
		line-height: 1.45;
	}

	.best-match {
		margin-top: 0.25rem;
		font-style: normal;
		font-size: 0.7rem;
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}

	.drop-preview {
		margin-top: 0.4rem;
		padding: 0.4rem;
		background: var(--color-success-subtle);
		border-radius: var(--radius-sm);
		font-size: 0.75rem;
		color: var(--color-success);
		text-align: center;
	}

	.fit-badge {
		display: inline-flex;
		align-items: center;
		padding: 0.15rem 0.5rem;
		border-radius: var(--radius-pill);
		font-size: 0.68rem;
		font-weight: 700;
	}

	.fit-excellent {
		background: var(--color-success-subtle);
		color: var(--color-success);
		border: 1px solid rgba(52, 211, 153, 0.2);
	}

	.fit-ok {
		background: var(--color-warning-subtle);
		color: var(--color-warning);
		border: 1px solid rgba(251, 191, 36, 0.2);
	}

	.fit-weak {
		background: var(--color-danger-subtle);
		color: var(--color-danger);
		border: 1px solid rgba(248, 113, 113, 0.2);
	}

	/* ═══════════ HUMANOID CARDS ═══════════ */
	.humanoid-item {
		cursor: grab;
		user-select: none;
	}

	.humanoid-item:active {
		cursor: grabbing;
	}

	.humanoid-item.dragging {
		opacity: 0.4;
		border-style: dashed;
		border-color: var(--color-primary);
	}

	.humanoid-item.in-training {
		opacity: 0.55;
		cursor: not-allowed;
		background: var(--color-warning-subtle);
		border-color: rgba(251, 191, 36, 0.25);
	}

	.humanoid-item.in-training:hover {
		transform: none;
		box-shadow: none;
	}

	.humanoid-item.in-training:active {
		cursor: not-allowed;
	}

	.h-top-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.drag-handle {
		font-size: 0.82rem;
		opacity: 0.3;
		cursor: grab;
		color: var(--color-text-muted);
	}

	.drag-handle.disabled {
		opacity: 0.12;
		cursor: not-allowed;
	}

	.h-stats {
		display: flex;
		gap: 0.5rem;
		font-size: 0.7rem;
		color: var(--color-text-light);
		margin-bottom: 0.35rem;
	}

	.h-skills {
		display: flex;
		flex-direction: column;
		gap: 3px;
	}

	.skill-bar {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		cursor: help;
	}

	.skill-label {
		font-size: 0.63rem;
		width: 3.2rem;
		color: var(--color-text-muted);
		font-weight: 500;
	}

	.skill-track {
		flex: 1;
		height: 5px;
		background: rgba(255, 255, 255, 0.06);
		border-radius: 3px;
		position: relative;
		overflow: hidden;
	}

	.skill-fill {
		height: 100%;
		background: linear-gradient(90deg, var(--color-primary-dark), var(--color-primary));
		border-radius: 3px;
		transition: width 0.3s ease;
		position: relative;
		z-index: 1;
	}

	.skill-fill-base {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		background: rgba(255, 255, 255, 0.08);
		border-radius: 3px;
		z-index: 0;
	}

	.skill-fill-match {
		background: linear-gradient(90deg, var(--color-success-dark), var(--color-success));
	}

	.skill-match {
		color: var(--color-success);
		font-weight: 700;
	}

	.skill-value {
		font-size: 0.63rem;
		min-width: 1.5rem;
		text-align: right;
		color: var(--color-text-light);
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 2px;
	}

	.skill-gain-indicator {
		font-size: 0.53rem;
		color: var(--color-success);
		font-weight: 700;
	}

	.humanoid-fit {
		margin-top: 0.3rem;
	}

	/* ═══════════ PLAYERS PANEL ═══════════ */
	.players-panel {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.player-card {
		padding: 0.6rem 0.65rem;
	}

	.player-card.active {
		background: var(--color-primary-subtle);
		border-color: rgba(56, 189, 248, 0.2);
		box-shadow: var(--shadow-glow-primary);
	}

	.player-header {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		width: 100%;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		text-align: left;
		color: var(--color-text);
	}

	.player-header:hover .expand-toggle {
		opacity: 1;
	}

	.player-name {
		font-weight: 700;
		font-size: 0.82rem;
		flex: 1;
	}

	.player-score-total {
		font-size: 0.75rem;
		font-weight: 800;
		color: var(--color-impact);
		white-space: nowrap;
		text-shadow: 0 0 8px var(--color-impact-glow);
	}

	.expand-toggle {
		font-size: 0.55rem;
		opacity: 0.35;
		transition: opacity var(--transition-fast);
		color: var(--color-text-muted);
	}

	.player-stats {
		display: flex;
		gap: 0.5rem;
		font-size: 0.75rem;
		margin-top: 0.3rem;
	}

	.player-breakdown {
		margin-top: 0.5rem;
		border-top: 1px solid var(--color-border);
		padding-top: 0.45rem;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.breakdown-section {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.breakdown-section :global(.tooltip-wrapper) {
		width: 100%;
		display: flex;
	}

	.breakdown-title {
		font-family: var(--font-display);
		font-size: 0.58rem;
		text-transform: uppercase;
		font-weight: 700;
		color: var(--color-primary);
		letter-spacing: 0.06em;
		margin-bottom: 0.15rem;
	}

	.breakdown-row {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.7rem;
		padding: 0.08rem 0;
		width: 100%;
	}

	.breakdown-icon {
		width: 1rem;
		text-align: center;
		flex-shrink: 0;
		font-size: 0.65rem;
	}

	.breakdown-label {
		flex: 1;
		color: var(--color-text-light);
	}

	.breakdown-value {
		font-weight: 600;
		text-align: right;
		min-width: 2.5rem;
		color: var(--color-success);
	}

	.breakdown-negative {
		color: var(--color-danger);
	}

	.breakdown-total {
		border-top: 1px solid var(--color-border);
		padding-top: 0.2rem;
		margin-top: 0.1rem;
	}

	.empty-msg {
		font-size: 0.82rem;
		color: var(--color-text-muted);
		font-style: italic;
	}

	/* ═══════════ ACTION BAR ═══════════ */
	.action-bar {
		background: linear-gradient(180deg, rgba(15, 29, 50, 0.95), rgba(10, 22, 40, 0.98));
		border-top: 1px solid var(--color-border);
		padding: 0.55rem 1.25rem;
		position: relative;
		z-index: 15;
		transition: box-shadow var(--transition);
		-webkit-backdrop-filter: blur(12px);
		backdrop-filter: blur(12px);
	}

	.action-buttons {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin-bottom: 0.25rem;
	}

	.message-bar {
		padding: 0.25rem 0.5rem;
		font-size: 0.8rem;
		color: var(--color-primary);
		font-weight: 500;
	}

	/* ═══════════ SHOP PANELS ═══════════ */
	.shop-panel {
		position: absolute;
		bottom: 100%;
		left: 1rem;
		right: 1rem;
		padding: 1.1rem;
		z-index: 20;
		box-shadow: var(--shadow-lg);
		max-height: 340px;
		overflow-y: auto;
		background: rgba(15, 29, 50, 0.97);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		-webkit-backdrop-filter: blur(16px);
		backdrop-filter: blur(16px);
	}

	.shop-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(195px, 1fr));
		gap: 0.5rem;
	}

	.shop-item {
		text-align: left;
		padding: 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		background: var(--color-surface);
		transition: all var(--transition-fast);
		color: var(--color-text);
	}

	.shop-item:hover:not(:disabled) {
		border-color: rgba(56, 189, 248, 0.3);
		background: var(--color-surface-elevated);
		box-shadow: var(--shadow-glow-primary);
		transform: translateY(-1px);
	}

	.shop-name {
		font-weight: 700;
		margin-bottom: 0.25rem;
		color: var(--color-text);
	}

	.shop-cost {
		color: var(--color-success);
		font-weight: 600;
		font-size: 0.82rem;
	}

	.shop-reliability {
		font-size: 0.78rem;
		color: var(--color-text-light);
	}

	.shop-skills {
		display: flex;
		gap: 0.25rem;
		flex-wrap: wrap;
		margin-top: 0.25rem;
	}

	.shop-skills-bars {
		display: flex;
		flex-direction: column;
		gap: 3px;
		margin-top: 0.35rem;
	}

	.shop-skill-bar {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.shop-skill-label {
		font-size: 0.6rem;
		width: 3rem;
		color: var(--color-text-muted);
	}

	.shop-skill-value {
		font-size: 0.6rem;
		min-width: 1.2rem;
		text-align: right;
		color: var(--color-text-light);
		font-weight: 600;
	}

	.shop-skill-bonus {
		color: var(--color-success);
		font-weight: 700;
	}

	.skill-fill-bonus {
		background: linear-gradient(90deg, var(--color-success-dark), var(--color-success));
	}

	.shop-desc {
		font-size: 0.78rem;
		color: var(--color-text-muted);
		margin-bottom: 0.25rem;
	}

	.shop-regulation {
		font-size: 0.7rem;
		color: var(--color-text-muted);
		font-style: italic;
		margin-bottom: 0.35rem;
		line-height: 1.3;
	}

	.shop-compliance-info {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		margin-top: 0.3rem;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.shop-compliance-failures.compliance-danger {
		color: var(--color-error);
		animation: pulse 1.5s infinite;
	}

	.compliance-ok {
		color: var(--color-success);
	}

	.compliance-low {
		color: var(--color-warning);
	}

	.compliance-failures-stat {
		color: var(--color-warning);
	}

	.event-card {
		background: var(--color-warning-subtle);
		border-color: rgba(251, 191, 36, 0.25);
	}

	.event-card h4 {
		font-size: 0.78rem;
		color: var(--color-warning);
	}

	.event-card p {
		font-size: 0.78rem;
		color: var(--color-text-light);
	}

	/* ═══════════ OVERLAYS & MODALS ═══════════ */
	.log-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.65);
		-webkit-backdrop-filter: blur(4px);
		backdrop-filter: blur(4px);
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.log-modal {
		width: 520px;
		max-width: 90vw;
		max-height: 70vh;
		display: flex;
		flex-direction: column;
		padding: 1.25rem 1.5rem;
		box-shadow: var(--shadow-lg);
		background: rgba(15, 29, 50, 0.97);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}

	.log-modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.75rem;
	}

	.log-modal-header h3 {
		margin: 0;
		font-size: 1rem;
		color: var(--color-text);
	}

	.log-modal-scroll {
		flex: 1;
		overflow-y: auto;
		min-height: 0;
	}

	.log-entry {
		font-size: 0.73rem;
		padding: 0.2rem 0;
		border-bottom: 1px solid var(--color-border);
		color: var(--color-text-light);
	}

	.log-round {
		font-weight: 700;
		margin-right: 0.3rem;
		color: var(--color-primary);
	}

	.log-success { color: var(--color-success); }
	.log-warning { color: var(--color-warning); }
	.log-error { color: var(--color-danger); }
	.log-info { color: var(--color-text-light); }

	.btn-active {
		box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.35);
		filter: brightness(0.85);
	}

	.training-badge {
		font-size: 0.63rem;
		background: var(--color-warning-subtle);
		color: var(--color-warning);
		padding: 0.12rem 0.45rem;
		border-radius: var(--radius-pill);
		font-weight: 700;
		border: 1px solid rgba(251, 191, 36, 0.2);
		animation: pulse 1.5s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.55; }
	}

	.training-info {
		color: var(--color-warning);
		font-weight: 600;
	}

	.sector-rep-row {
		display: flex;
		gap: 0.25rem;
		flex-wrap: wrap;
		margin-top: 0.25rem;
	}

	.sector-rep-badge {
		font-size: 0.58rem;
		padding: 0.08rem 0.35rem;
		border-radius: var(--radius-pill);
		background: var(--color-secondary-glow);
		color: var(--color-secondary);
		font-weight: 600;
	}

	.modal-desc {
		font-size: 0.8rem;
		color: var(--color-text-light);
		margin-bottom: 0.75rem;
		line-height: 1.55;
	}

	.sector-choice {
		text-align: center;
	}

	.sector-current {
		font-size: 0.78rem;
		color: var(--color-text-muted);
	}

	.sector-after {
		font-size: 0.82rem;
		color: var(--color-success);
	}

	.sector-gain {
		font-size: 0.72rem;
		color: var(--color-success);
		font-weight: 700;
	}

	.modal-cancel {
		margin-top: 0.5rem;
		font-size: 0.8rem;
	}

	.modal-info-row {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
		margin-bottom: 0.75rem;
		padding: 0.55rem 0.85rem;
		background: var(--color-primary-subtle);
		border-radius: var(--radius);
		border: 1px solid rgba(56, 189, 248, 0.15);
	}

	.modal-info-item {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-primary);
		cursor: help;
		white-space: nowrap;
	}

	.supplier-bonus {
		font-size: 0.8rem;
		color: var(--color-success);
		font-weight: 600;
		margin-bottom: 0.25rem;
		cursor: help;
	}

	.supplier-contracted {
		margin-top: 0.25rem;
		font-size: 0.65rem;
	}

	.sector-star {
		font-size: 0.68rem;
	}

	.shop-type {
		font-size: 0.68rem;
		margin-bottom: 0.25rem;
	}

	/* ═══════════ TUTORIAL ═══════════ */
	.tutorial-overlay {
		position: fixed;
		inset: 0;
		z-index: 100;
		pointer-events: none;
	}

	.tutorial-card {
		position: absolute;
		background: rgba(15, 29, 50, 0.97);
		border: 2px solid var(--color-accent);
		border-radius: var(--radius-lg);
		padding: 1.25rem 1.5rem;
		max-width: 420px;
		box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5), 0 0 0 4000px rgba(0, 0, 0, 0.45), var(--shadow-glow-accent);
		pointer-events: auto;
		animation: tutorial-appear 0.3s cubic-bezier(0.16, 1, 0.3, 1);
	}

	@keyframes tutorial-appear {
		from { opacity: 0; transform: translateY(10px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.tutorial-center {
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}

	.tutorial-top {
		top: 60px;
		left: 50%;
		transform: translateX(-50%);
	}

	.tutorial-bottom {
		bottom: 100px;
		left: 50%;
		transform: translateX(-50%);
	}

	.tutorial-bottom-left {
		bottom: 100px;
		left: 300px;
	}

	.tutorial-bottom-right {
		bottom: 100px;
		right: 300px;
	}

	.tutorial-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.tutorial-step-badge {
		background: var(--color-accent);
		color: #1a1207;
		padding: 0.18rem 0.55rem;
		border-radius: var(--radius-pill);
		font-size: 0.68rem;
		font-weight: 700;
		text-transform: uppercase;
		flex-shrink: 0;
		letter-spacing: 0.04em;
	}

	.tutorial-header h3 {
		font-size: 1rem;
		margin: 0;
		color: var(--color-text);
	}

	.tutorial-card p {
		font-size: 0.88rem;
		line-height: 1.6;
		color: var(--color-text-light);
		margin-bottom: 1rem;
	}

	.tutorial-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.tutorial-hint {
		font-size: 0.78rem;
		color: var(--color-accent);
		font-weight: 600;
		font-style: italic;
	}

	.tutorial-skip {
		font-size: 0.78rem;
		padding: 0.3rem 0.75rem;
		border-width: 1px;
		opacity: 0.6;
	}

	.tutorial-skip:hover {
		opacity: 1;
	}

	/* ═══════════ IMPACT SCORE PANEL ═══════════ */
	.impact-score-panel {
		margin-top: 0.45rem;
		padding: 0.55rem;
		background: var(--color-surface-glass);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	.impact-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.35rem;
	}

	.buy-ap-section {
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--color-border);
	}

	.btn-buy-ap {
		width: 100%;
		padding: 0.6rem 1rem;
		background: linear-gradient(135deg, var(--color-secondary), var(--color-secondary-dark));
		color: white;
		border: none;
		border-radius: var(--radius);
		font-weight: 700;
		font-size: 0.82rem;
		cursor: pointer;
		transition: all var(--transition-fast);
		box-shadow: 0 2px 8px var(--color-secondary-glow);
	}

	.btn-buy-ap:hover:not(:disabled) {
		box-shadow: 0 4px 16px var(--color-secondary-glow);
		transform: translateY(-1px);
	}

	.btn-buy-ap:disabled {
		opacity: 0.35;
		cursor: not-allowed;
		filter: grayscale(0.5);
	}

	.impact-rows {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.impact-rows :global(.tooltip-wrapper) {
		width: 100%;
		display: flex;
	}

	.impact-row {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.68rem;
		padding: 0.1rem 0;
		width: 100%;
	}

	.impact-icon {
		width: 1.1rem;
		text-align: center;
		flex-shrink: 0;
		font-size: 0.7rem;
	}

	.impact-label {
		flex: 1;
		color: var(--color-text-light);
	}

	.impact-value {
		font-weight: 700;
		min-width: 2rem;
		text-align: right;
	}

	.impact-value.positive {
		color: var(--color-success);
	}

	.impact-value.negative {
		color: var(--color-danger);
	}

	/* ═══════════ SHOP COSTS / TRAITS ═══════════ */
	.shop-costs {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.25rem;
	}

	.shop-maintenance {
		color: var(--color-danger);
		font-size: 0.78rem;
		font-weight: 600;
	}

	.shop-type-traits {
		margin: 0.25rem 0;
	}

	.trait-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.2rem;
		padding: 0.15rem 0.45rem;
		border-radius: var(--radius-pill);
		font-size: 0.65rem;
		font-weight: 700;
	}

	.trait-robot {
		background: var(--color-primary-subtle);
		color: var(--color-primary);
		border: 1px solid rgba(56, 189, 248, 0.2);
	}

	.trait-human {
		background: var(--color-warning-subtle);
		color: var(--color-warning);
		border: 1px solid rgba(251, 191, 36, 0.2);
	}

	.type-hint {
		display: inline-block;
		padding: 0.1rem 0.4rem;
		border-radius: var(--radius-pill);
		font-size: 0.72rem;
		font-weight: 600;
		margin-left: 0.25rem;
	}

	.type-hint-robot {
		background: var(--color-primary-subtle);
		color: var(--color-primary);
	}

	.type-hint-human {
		background: var(--color-warning-subtle);
		color: var(--color-warning);
	}

	.safety-badge {
		display: inline-flex;
		align-items: center;
		font-size: 0.53rem;
		padding: 0.05rem 0.25rem;
		border-radius: var(--radius-pill);
		margin-left: 0.2rem;
		font-weight: 700;
	}

	.safety-low {
		background: var(--color-danger-subtle);
		color: var(--color-danger);
	}

	.safety-mid {
		background: var(--color-warning-subtle);
		color: var(--color-warning);
	}

	.safety-high {
		background: var(--color-success-subtle);
		color: var(--color-success);
	}

	.idle-badge {
		display: inline-flex;
		align-items: center;
		font-size: 0.53rem;
		padding: 0.05rem 0.25rem;
		border-radius: var(--radius-pill);
		margin-left: 0.2rem;
		font-weight: 700;
		background: var(--color-warning-subtle);
		color: var(--color-warning);
	}

	.assign-drag-hint {
		font-size: 0.7rem;
		color: var(--color-primary);
		font-style: italic;
		text-align: center;
		padding: 0.35rem;
		margin-top: 0.35rem;
		background: var(--color-primary-subtle);
		border-radius: var(--radius-sm);
		border: 1px solid rgba(56, 189, 248, 0.1);
	}

	.job-limit-msg {
		color: var(--color-danger);
		font-weight: 600;
	}

	.jobs-remaining {
		font-size: 0.63rem;
		color: var(--color-text-muted);
		margin-top: 0.25rem;
		font-weight: 600;
	}

	.pending-assignment {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 0.45rem;
		padding: 0.35rem 0.55rem;
		background: var(--color-primary-subtle);
		border: 1px solid rgba(56, 189, 248, 0.2);
		border-radius: var(--radius);
		font-size: 0.72rem;
		font-weight: 600;
		color: var(--color-primary);
	}

	.pending-remove {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 0.68rem;
		padding: 0.1rem 0.3rem;
		border-radius: var(--radius-sm);
		opacity: 0.6;
		color: var(--color-text-light);
	}

	.pending-remove:hover {
		opacity: 1;
		background: rgba(255, 255, 255, 0.06);
	}

	.btn-success {
		background: linear-gradient(135deg, var(--color-success), var(--color-success-dark));
		color: #0a1628;
		border: none;
		padding: 0.5rem 1.1rem;
		border-radius: var(--radius);
		cursor: pointer;
		font-weight: 700;
		font-size: 0.82rem;
		animation: pulse 1.5s ease-in-out infinite;
		box-shadow: 0 2px 8px var(--color-success-glow);
	}

	.btn-success:hover {
		box-shadow: 0 4px 16px var(--color-success-glow);
	}

	/* ═══════════ JOB RESULT POPUP ═══════════ */
	.jobresult-modal {
		width: 500px;
		max-width: 95vw;
		max-height: 85vh;
		overflow-y: auto;
		padding: 1.5rem 1.75rem;
		box-shadow: var(--shadow-lg);
		background: rgba(15, 29, 50, 0.97);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-xl);
	}

	.jobresult-header {
		margin-bottom: 1rem;
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 0.6rem;
	}

	.jobresult-header h3 {
		margin: 0;
		font-family: var(--font-display);
		font-size: 1rem;
		color: var(--color-text);
		text-transform: none;
		letter-spacing: 0.03em;
	}

	.jobresult-entry {
		padding: 0.8rem;
		border-radius: var(--radius);
		border: 1px solid var(--color-border);
		background: var(--color-surface);
	}

	.jobresult-entry.jobresult-success { border-color: rgba(52, 211, 153, 0.3); background: var(--color-success-subtle); }
	.jobresult-entry.jobresult-partial { border-color: rgba(251, 191, 36, 0.3); background: var(--color-warning-subtle); }
	.jobresult-entry.jobresult-failed { border-color: rgba(248, 113, 113, 0.3); background: var(--color-danger-subtle); }
	.jobresult-entry.jobresult-error { border-color: rgba(248, 113, 113, 0.3); background: var(--color-danger-subtle); }

	.jobresult-title-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.3rem;
	}

	.jobresult-job-name {
		font-weight: 700;
		font-size: 0.88rem;
		color: var(--color-text);
	}

	.jobresult-humanoid {
		font-size: 0.75rem;
		color: var(--color-text-light);
		margin-bottom: 0.5rem;
	}

	.jobresult-error-msg {
		font-size: 0.82rem;
		color: var(--color-danger);
		font-weight: 600;
		padding: 0.5rem 0;
	}

	.jobresult-breakdown {
		display: flex;
		flex-direction: column;
		gap: 2px;
		margin-bottom: 0.5rem;
	}

	.jobresult-breakdown :global(.tooltip-wrapper) {
		width: 100%;
	}

	.jr-hoverable {
		cursor: help;
		border-radius: var(--radius-sm);
		padding-left: 0.3rem;
		padding-right: 0.3rem;
		transition: background var(--transition-fast);
	}

	.jr-hoverable:hover {
		background: rgba(255, 255, 255, 0.04);
	}

	.jobresult-score-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.75rem;
		padding: 0.12rem 0;
		color: var(--color-text-light);
	}

	.jobresult-score-row.jobresult-base {
		font-weight: 600;
		color: var(--color-text);
	}

	.jobresult-score-row.jobresult-final {
		font-weight: 700;
		font-size: 0.88rem;
		color: var(--color-text);
	}

	.jobresult-final-value {
		font-size: 1.1rem;
		font-weight: 800;
		color: var(--color-primary);
	}

	.jr-positive { color: var(--color-success); font-weight: 600; }
	.jr-negative { color: var(--color-danger); font-weight: 600; }

	.jobresult-divider {
		height: 1px;
		background: linear-gradient(90deg, transparent, var(--color-border), transparent);
		margin: 0.35rem 0;
	}

	.jobresult-outcome {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.65rem 0.8rem;
		border-radius: var(--radius);
		margin-top: 0.3rem;
	}

	.jobresult-outcome.outcome-success {
		background: var(--color-success-subtle);
		border: 1px solid rgba(52, 211, 153, 0.2);
	}

	.jobresult-outcome.outcome-partial {
		background: var(--color-warning-subtle);
		border: 1px solid rgba(251, 191, 36, 0.2);
	}

	.jobresult-outcome.outcome-failed {
		background: var(--color-danger-subtle);
		border: 1px solid rgba(248, 113, 113, 0.2);
	}

	.outcome-icon {
		font-size: 1.5rem;
	}

	.outcome-text {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.outcome-text strong {
		font-size: 0.88rem;
		color: var(--color-text);
	}

	.outcome-rewards {
		display: flex;
		gap: 0.75rem;
		font-size: 0.78rem;
	}

	.jobresult-separator {
		height: 1px;
		background: var(--color-border);
		margin: 0.75rem 0;
	}

	.jobresult-actions {
		display: flex;
		justify-content: center;
		margin-top: 1rem;
	}

	/* ═══════════ END TURN POPUP ═══════════ */
	.endturn-modal {
		width: 600px;
		max-width: 95vw;
		max-height: 85vh;
		overflow-y: auto;
		padding: 1.5rem 1.75rem;
		box-shadow: var(--shadow-lg);
		background: rgba(15, 29, 50, 0.97);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-xl);
	}

	.endturn-header {
		margin-bottom: 1rem;
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 0.6rem;
	}

	.endturn-header h3 {
		margin: 0;
		font-family: var(--font-display);
		font-size: 1rem;
		color: var(--color-text);
		text-transform: none;
		letter-spacing: 0.03em;
	}

	.endturn-table {
		margin-bottom: 1rem;
	}

	.endturn-row {
		display: grid;
		grid-template-columns: 180px 70px 80px 70px;
		gap: 0.5rem;
		align-items: center;
		padding: 0.35rem 0;
		border-bottom: 1px solid var(--color-border-light);
	}

	.endturn-row-header {
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 0.4rem;
		margin-bottom: 0.2rem;
	}

	.endturn-label-col {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.endturn-cur-col {
		font-size: 0.82rem;
		font-weight: 600;
		text-align: center;
		color: var(--color-text-light);
	}

	.endturn-arrow-col {
		font-size: 0.75rem;
		text-align: center;
	}

	.endturn-new-col {
		font-size: 0.82rem;
		font-weight: 600;
		text-align: center;
	}

	.endturn-row-header .endturn-label-col,
	.endturn-row-header .endturn-cur-col,
	.endturn-row-header .endturn-arrow-col,
	.endturn-row-header .endturn-new-col {
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		color: var(--color-text-muted);
		letter-spacing: 0.04em;
	}

	.endturn-new {
		color: var(--color-primary);
		font-weight: 700;
	}

	.endturn-explain {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		padding: 0.15rem 0 0.4rem 1.2rem;
		font-size: 0.68rem;
		line-height: 1.45;
	}

	.endturn-explain-sub {
		font-size: 0.6rem;
		color: var(--color-text-muted);
		font-weight: 400;
		margin-left: 0.5rem;
	}

	.endturn-neutral-text {
		color: var(--color-text-muted);
		font-style: italic;
	}

	.endturn-pos {
		color: var(--color-success);
		font-weight: 600;
	}

	.endturn-neg {
		color: var(--color-danger);
		font-weight: 600;
	}

	.endturn-neutral {
		color: var(--color-text-muted);
		opacity: 0.5;
	}

	.endturn-impact-detail {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		padding: 0.8rem;
		margin-bottom: 1rem;
	}

	.endturn-detail-title {
		font-family: var(--font-display);
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		color: var(--color-primary);
		margin-bottom: 0.55rem;
		letter-spacing: 0.06em;
	}

	.endturn-detail-grid {
		display: grid;
		grid-template-columns: 1fr auto auto auto;
		gap: 0.2rem 0.75rem;
		align-items: center;
	}

	.endturn-detail-header {
		font-size: 0.62rem;
		font-weight: 700;
		text-transform: uppercase;
		color: var(--color-text-muted);
		text-align: center;
		letter-spacing: 0.04em;
	}

	.endturn-detail-label {
		font-size: 0.75rem;
		color: var(--color-text);
	}

	.endturn-detail-val {
		font-size: 0.75rem;
		font-weight: 600;
		text-align: center;
		min-width: 3rem;
		color: var(--color-text-light);
	}

	.endturn-detail-explain {
		grid-column: 1 / -1;
		font-size: 0.6rem;
		color: var(--color-text-muted);
		font-style: italic;
		padding-left: 1.5rem;
		padding-bottom: 0.2rem;
	}

	.endturn-actions {
		display: flex;
		justify-content: space-between;
		gap: 0.75rem;
	}

	/* ═══════════ PODIUM ═══════════ */
	.podium-modal {
		width: 620px;
		max-width: 95vw;
		max-height: 85vh;
		overflow-y: auto;
		padding: 1.75rem 2rem;
		box-shadow: var(--shadow-lg);
		text-align: center;
		background: rgba(15, 29, 50, 0.97);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-xl);
	}

	.podium-title {
		font-family: var(--font-display);
		font-size: 1.3rem;
		margin: 0 0 1.5rem;
		color: var(--color-text);
		letter-spacing: 0.05em;
	}

	.podium-stage {
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
		margin-bottom: 1.5rem;
	}

	.podium-entry {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.8rem 1rem;
		border-radius: var(--radius-lg);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		transition: all var(--transition-fast);
	}

	.podium-1 {
		background: rgba(251, 191, 36, 0.08);
		border-color: rgba(251, 191, 36, 0.3);
		box-shadow: 0 0 20px var(--color-impact-glow);
	}

	.podium-2 {
		background: var(--color-surface-elevated);
		border-color: rgba(148, 163, 184, 0.2);
	}

	.podium-3 {
		background: rgba(217, 119, 6, 0.06);
		border-color: rgba(217, 119, 6, 0.2);
	}

	.podium-off {
		opacity: 0.6;
	}

	.podium-rank {
		flex-shrink: 0;
		width: 2.5rem;
		text-align: center;
	}

	.podium-medal {
		font-size: 1.8rem;
	}

	.podium-medal-none {
		font-size: 1rem;
		font-weight: 700;
		color: var(--color-text-muted);
	}

	.podium-bar {
		flex: 1;
		border-radius: var(--radius);
		padding: 0.55rem 0.8rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.podium-player-name {
		font-weight: 700;
		font-size: 1rem;
	}

	.podium-score {
		font-weight: 800;
		font-size: 0.95rem;
		color: var(--color-impact);
		text-shadow: 0 0 8px var(--color-impact-glow);
	}

	.podium-details {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		font-size: 0.7rem;
		text-align: left;
		min-width: 120px;
		color: var(--color-text-light);
	}

	.podium-win {
		color: var(--color-success);
		font-weight: 700;
	}

	.podium-lose {
		color: var(--color-danger);
		font-weight: 600;
	}

	.podium-actions {
		margin-top: 0.5rem;
	}
</style>
