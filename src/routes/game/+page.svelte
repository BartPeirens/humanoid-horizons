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
	import { CONTINENT_CONFIG, HUMANOID_CARDS, SUPPLIERS, SECTOR_TYPE_BONUS, TRAINING_MULTIPLIER, UPGRADE_MULTIPLIER, TRAINING_COST } from '$lib/game/constants';
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
		return calculateScoreBreakdown(humanoid, job, player, false);
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
					<span class="badge badge-info">Ronde {state.round}/{state.maxRounds}</span>
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
					<span class="badge badge-info">{player?.actionPoints} actiepunten</span>
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
						<div class="legend-item" class:legend-locked={!unlocked}>
							<span class="legend-color" style="background: {CONTINENT_COLORS[id]}"></span>
							<span class="legend-name">{config.name}</span>
							{#if !unlocked}
								<span class="legend-lock">&#x1F512;</span>
							{:else}
								<span class="legend-check">&#x2705;</span>
							{/if}
						</div>
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
						<div class="player-card card" class:active={isActive} style="border-left: 4px solid {p.color}">
							<button class="player-header" onclick={() => togglePlayerExpand(p.id)}>
								<div class="player-name">{p.name}</div>
								<div class="player-score-total" title="Impact Score">
									&#x1F3C6; {impact.total}
								</div>
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
								draggable={!isTraining && player.actionPoints >= 1}
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
									<span>&#x2764;&#xFE0F; {h.condition}%</span>
									<span>&#x1F393; Lv{h.trainingLevel}</span>
									<span>&#x1F527; {h.card.reliability}%</span>
									{#if h.card.type === 'robot'}
										<span class="safety-badge" class:safety-low={h.safety < 40} class:safety-mid={h.safety >= 40 && h.safety < 70} class:safety-high={h.safety >= 70} title="Veiligheid">&#x1F6E1;&#xFE0F; {h.safety}</span>
									{/if}
									{#if h.trainingTurnsLeft > 0 && h.trainingSector}
										<span class="training-info">Traint: {SECTOR_LABELS[h.trainingSector]}</span>
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
												<span class="dice-hint">&#x1F3B2; ±5 bij uitvoering</span>
											</div>
											<div class="impact-rows">
												<div class="impact-row">
													<span class="impact-icon">&#x1F3AF;</span>
													<span class="impact-label">Skill</span>
													<span class="impact-value positive">+{bd.skillScore}</span>
												</div>
												<div class="impact-row">
													<span class="impact-icon">&#x1F527;</span>
													<span class="impact-label">Betrouwbaarheid</span>
													<span class="impact-value positive">+{bd.reliabilityScore}</span>
												</div>
												{#if bd.trainingBonus > 0}
													<div class="impact-row">
														<span class="impact-icon">&#x1F393;</span>
														<span class="impact-label">Training</span>
														<span class="impact-value positive">+{bd.trainingBonus}</span>
													</div>
												{/if}
												{#if bd.supplierBonus > 0}
													<div class="impact-row">
														<span class="impact-icon">&#x1F3ED;</span>
														<span class="impact-label">Leverancier</span>
														<span class="impact-value positive">+{bd.supplierBonus}</span>
													</div>
												{/if}
												{#if bd.typeBonus > 0}
													<div class="impact-row">
														<span class="impact-icon">{h.card.type === 'human' ? '\u{2764}\u{FE0F}' : '\u{26A1}'}</span>
														<span class="impact-label">{bd.typeBonusLabel}</span>
														<span class="impact-value positive">+{bd.typeBonus}</span>
													</div>
												{/if}
												{#if bd.complianceModifier !== 0}
													<div class="impact-row">
														<span class="impact-icon">&#x1F4CB;</span>
														<span class="impact-label">Compliance</span>
														<span class="impact-value {bd.complianceModifier >= 0 ? 'positive' : 'negative'}">{bd.complianceModifier >= 0 ? '+' : ''}{bd.complianceModifier}</span>
													</div>
												{/if}
												<div class="impact-row">
													<span class="impact-icon">&#x26A0;&#xFE0F;</span>
													<span class="impact-label">Risico</span>
													<span class="impact-value negative">-{bd.riskPenalty}</span>
												</div>
												{#if bd.conditionPenalty > 0}
													<div class="impact-row">
														<span class="impact-icon">&#x1F4A5;</span>
														<span class="impact-label">Schade</span>
														<span class="impact-value negative">-{bd.conditionPenalty}</span>
													</div>
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
								{#if player?.continents[id as Continent].unlocked}
									<span class="badge badge-success">Ontgrendeld</span>
								{:else}
									<span class="shop-cost">&#x1F4B0; 25 cash</span>
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
									<div class="jobresult-dice jr-hoverable" class:dice-positive={bd.diceRoll > 0} class:dice-negative={bd.diceRoll < 0} class:dice-neutral={bd.diceRoll === 0}>
										<span class="dice-icon">&#x1F3B2;</span>
										<span class="dice-label">
											{#if bd.diceRoll > 0}
												Geluk! +{bd.diceRoll}
											{:else if bd.diceRoll < 0}
												Pech! {bd.diceRoll}
											{:else}
												Neutraal
											{/if}
										</span>
										<span class="dice-value">{bd.diceRoll > 0 ? '+' : ''}{bd.diceRoll}</span>
									</div>
									{/snippet}
									{#snippet content()}<span class="tt-label">Dobbelsteenworp (2d6 - 7)</span>Er worden 2 dobbelstenen gegooid. Het resultaat gaat van <strong>-5</strong> (dubbel 1) tot <strong>+5</strong> (dubbel 6). Dit is puur geluk — je kunt het niet beïnvloeden. Een hogere basis score geeft meer buffer tegen pech.{/snippet}
								</Tooltip>

								<div class="jobresult-divider"></div>

								<Tooltip position="right">
									{#snippet children()}
									<div class="jobresult-score-row jobresult-final jr-hoverable">
										<span>Eindscore</span>
										<span class="jobresult-final-value">{Math.round(jr.result.finalScore)}</span>
									</div>
									{/snippet}
									{#snippet content()}
										<span class="tt-label">Eindscore</span>
										<div>Basis score ({bd.baseScore}) + dobbelsteen ({bd.diceRoll > 0 ? '+' : ''}{bd.diceRoll}) = <strong>{Math.round(jr.result.finalScore)}</strong></div>
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
								<div class="podium-score">{impact.total} punten</div>
							</div>
							<div class="podium-details">
								<span>&#x1F4B0; {p.cash}</span>
								<span>&#x2B50; {p.reputation}</span>
								<span>&#x2705; {p.successfulJobs} opdrachten</span>
								<span class={goalsCount >= 2 ? 'podium-win' : 'podium-lose'}>
									{goalsCount}/3 doelen {goalsCount >= 2 ? 'behaald' : ''}
								</span>
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
	}

	.top-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 1rem;
		background: var(--color-surface);
		border-bottom: 1px solid var(--color-border);
		box-shadow: var(--shadow);
		z-index: 10;
	}

	.game-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.header-logo {
		width: 32px;
		height: 32px;
		flex-shrink: 0;
	}

	.game-title {
		font-weight: 700;
		font-size: 1.1rem;
		color: var(--color-primary);
	}

	.turn-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.btn-sm {
		font-size: 0.78rem;
		padding: 0.25rem 0.6rem;
	}

	.main-area {
		display: flex;
		flex: 1;
		overflow: hidden;
	}

	.sidebar {
		width: 280px;
		padding: 0.5rem;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		transition: box-shadow 0.3s;
	}

	.left-sidebar {
		border-right: 1px solid var(--color-border);
	}

	.right-sidebar {
		border-left: 1px solid var(--color-border);
	}

	.board-wrapper {
		flex: 1;
		position: relative;
		overflow: hidden;
		transition: box-shadow 0.3s;
	}

	.board-container {
		width: 100%;
		height: 100%;
		background: #B3D9F2;
	}

	.zoom-controls {
		position: absolute;
		top: 12px;
		right: 12px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		z-index: 5;
	}

	.zoom-btn {
		width: 36px;
		height: 36px;
		border: 1px solid rgba(0, 0, 0, 0.15);
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.92);
		font-size: 1.2rem;
		font-weight: 700;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #333;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
		transition: background 0.15s;
	}

	.zoom-btn:hover:not(:disabled) {
		background: #e0e7ff;
	}

	.zoom-btn:disabled {
		opacity: 0.35;
		cursor: default;
	}

	.zoom-reset {
		margin-top: 4px;
		font-size: 1rem;
	}

	.zoom-level {
		width: 36px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: 700;
		color: #555;
		background: rgba(255, 255, 255, 0.8);
		border-radius: 4px;
	}

	.map-legend {
		position: absolute;
		bottom: 12px;
		left: 12px;
		background: rgba(255, 255, 255, 0.92);
		border-radius: 8px;
		padding: 0.6rem 0.8rem;
		font-size: 0.75rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		pointer-events: auto;
		z-index: 5;
	}

	.legend-title {
		font-weight: 700;
		font-size: 0.8rem;
		margin-bottom: 0.4rem;
		color: #333;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.15rem 0;
	}

	.legend-locked {
		opacity: 0.45;
	}

	.legend-color {
		width: 12px;
		height: 12px;
		border-radius: 3px;
		flex-shrink: 0;
	}

	.legend-name {
		flex: 1;
		color: #444;
	}

	.legend-lock, .legend-check {
		font-size: 0.65rem;
	}

	.legend-divider {
		height: 1px;
		background: #ddd;
		margin: 0.3rem 0;
	}

	.legend-hint {
		font-size: 0.65rem;
		color: #999;
		margin-top: 0.3rem;
		font-style: italic;
	}

	.tutorial-highlight {
		box-shadow: inset 0 0 0 3px var(--color-accent), 0 0 20px rgba(234, 179, 8, 0.3);
		z-index: 5;
	}

	.sidebar h3 {
		font-size: 0.85rem;
		text-transform: uppercase;
		color: var(--color-text-light);
		margin-bottom: 0.5rem;
	}

	.job-item, .humanoid-item {
		display: block;
		width: 100%;
		text-align: left;
		padding: 0.5rem;
		margin-bottom: 0.3rem;
		border: 2px solid var(--color-border);
		border-radius: var(--radius);
		background: var(--color-surface);
		transition: all 0.15s;
	}

	.job-item:hover, .humanoid-item:hover {
		border-color: var(--color-primary);
		background: #f8fafc;
	}

	.job-item.selected, .humanoid-item.selected {
		border-color: var(--color-primary);
		background: #eff6ff;
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
	}

	.job-item.drop-target {
		border-color: var(--color-success);
		background: #f0fdf4;
		box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.3);
	}

	.job-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.job-explanation {
		font-size: 0.7rem;
		color: var(--color-text-light);
		font-style: italic;
		line-height: 1.4;
		margin-bottom: 0.3rem;
		opacity: 0.85;
	}

	.job-stat-item, .player-stat-item {
		cursor: help;
	}

	.job-title, .h-name {
		font-weight: 600;
		font-size: 0.85rem;
		margin-bottom: 0.25rem;
	}

	.lock-icon {
		font-size: 0.75rem;
		opacity: 0.6;
	}

	.job-item.locked {
		opacity: 0.45;
	}

	.job-meta {
		display: flex;
		gap: 0.25rem;
		margin-bottom: 0.3rem;
		flex-wrap: wrap;
	}

	.continent-badge {
		display: inline-block;
		padding: 0.1rem 0.4rem;
		border-radius: 999px;
		font-size: 0.65rem;
		font-weight: 700;
	}

	.job-stats {
		display: flex;
		gap: 0.5rem;
		font-size: 0.72rem;
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
		font-size: 0.72rem;
		color: var(--color-primary);
		font-style: italic;
		margin-top: 0.4rem;
		line-height: 1.4;
	}

	.best-match {
		margin-top: 0.25rem;
		font-style: normal;
		font-size: 0.72rem;
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}

	.drop-preview {
		margin-top: 0.4rem;
		padding: 0.4rem;
		background: #f0fdf4;
		border-radius: 6px;
		font-size: 0.75rem;
		color: #166534;
		text-align: center;
	}

	.fit-badge {
		display: inline-block;
		padding: 0.1rem 0.4rem;
		border-radius: 4px;
		font-size: 0.7rem;
		font-weight: 700;
	}

	.fit-excellent {
		background: #dcfce7;
		color: #166534;
	}

	.fit-ok {
		background: #fef9c3;
		color: #854d0e;
	}

	.fit-weak {
		background: #fecaca;
		color: #991b1b;
	}

	.humanoid-item {
		cursor: grab;
		user-select: none;
	}

	.humanoid-item:active {
		cursor: grabbing;
	}

	.humanoid-item.dragging {
		opacity: 0.5;
		border-style: dashed;
	}

	.humanoid-item.in-training {
		opacity: 0.6;
		cursor: not-allowed;
		background: #fef9c3;
		border-color: #fbbf24;
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
		font-size: 0.85rem;
		opacity: 0.35;
		cursor: grab;
	}

	.drag-handle.disabled {
		opacity: 0.15;
		cursor: not-allowed;
	}

	.h-stats {
		display: flex;
		gap: 0.5rem;
		font-size: 0.72rem;
		color: var(--color-text-light);
		margin-bottom: 0.3rem;
	}

	.h-skills {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.skill-bar {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		cursor: help;
	}

	.skill-label {
		font-size: 0.65rem;
		width: 3.2rem;
		color: var(--color-text-light);
	}

	.skill-track {
		flex: 1;
		height: 5px;
		background: var(--color-border);
		border-radius: 3px;
		position: relative;
	}

	.skill-fill {
		height: 100%;
		background: var(--color-primary);
		border-radius: 3px;
		transition: width 0.3s;
		position: relative;
		z-index: 1;
	}

	.skill-fill-base {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		background: rgba(100, 100, 100, 0.4);
		border-radius: 3px;
		z-index: 0;
	}

	.skill-fill-match {
		background: var(--color-success);
	}

	.skill-match {
		color: var(--color-success);
		font-weight: 700;
	}

	.skill-value {
		font-size: 0.65rem;
		min-width: 1.5rem;
		text-align: right;
		color: var(--color-text-light);
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 2px;
	}

	.skill-gain-indicator {
		font-size: 0.55rem;
		color: var(--color-success);
		font-weight: 700;
	}

	.humanoid-fit {
		margin-top: 0.3rem;
	}

	.players-panel {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.player-card {
		padding: 0.5rem;
	}

	.player-card.active {
		background: #f0f9ff;
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
	}

	.player-header:hover .expand-toggle {
		opacity: 1;
	}

	.player-name {
		font-weight: 600;
		font-size: 0.85rem;
		flex: 1;
	}

	.player-score-total {
		font-size: 0.78rem;
		font-weight: 700;
		color: #b45309;
		white-space: nowrap;
	}

	.expand-toggle {
		font-size: 0.6rem;
		opacity: 0.4;
		transition: opacity 0.15s;
		color: var(--color-text-light);
	}

	.player-stats {
		display: flex;
		gap: 0.5rem;
		font-size: 0.8rem;
		margin-top: 0.25rem;
	}

	.player-breakdown {
		margin-top: 0.4rem;
		border-top: 1px solid var(--color-border);
		padding-top: 0.4rem;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.breakdown-section {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.breakdown-section :global(.tooltip-wrapper) {
		width: 100%;
	}

	.breakdown-title {
		font-size: 0.62rem;
		text-transform: uppercase;
		font-weight: 700;
		color: var(--color-text-light);
		letter-spacing: 0.03em;
		margin-bottom: 0.1rem;
	}

	.breakdown-row {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.7rem;
		padding: 0.05rem 0;
	}

	.breakdown-icon {
		width: 1rem;
		text-align: center;
		flex-shrink: 0;
		font-size: 0.68rem;
	}

	.breakdown-label {
		flex: 1;
		color: var(--color-text-light);
	}

	.breakdown-value {
		font-weight: 600;
		text-align: right;
		min-width: 2.5rem;
		color: #166534;
	}

	.breakdown-negative {
		color: #dc2626;
	}

	.breakdown-total {
		border-top: 1px solid var(--color-border);
		padding-top: 0.15rem;
		margin-top: 0.1rem;
	}

	.empty-msg {
		font-size: 0.85rem;
		color: var(--color-text-light);
		font-style: italic;
	}

	.action-bar {
		background: var(--color-surface);
		border-top: 1px solid var(--color-border);
		padding: 0.5rem 1rem;
		position: relative;
		transition: box-shadow 0.3s;
	}

	.action-buttons {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin-bottom: 0.25rem;
	}

	.message-bar {
		padding: 0.25rem 0.5rem;
		font-size: 0.85rem;
		color: var(--color-primary);
		font-weight: 500;
	}

	.shop-panel {
		position: absolute;
		bottom: 100%;
		left: 1rem;
		right: 1rem;
		padding: 1rem;
		z-index: 20;
		box-shadow: var(--shadow-lg);
		max-height: 300px;
		overflow-y: auto;
	}

	.shop-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: 0.5rem;
	}

	.shop-item {
		text-align: left;
		padding: 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		background: var(--color-surface);
	}

	.shop-item:hover:not(:disabled) {
		border-color: var(--color-primary);
		background: #f0f9ff;
	}

	.shop-name {
		font-weight: 600;
		margin-bottom: 0.25rem;
	}

	.shop-cost {
		color: var(--color-success);
		font-weight: 600;
		font-size: 0.85rem;
	}

	.shop-reliability {
		font-size: 0.8rem;
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
		gap: 2px;
		margin-top: 0.3rem;
	}

	.shop-skill-bar {
		display: flex;
		align-items: center;
		gap: 0.2rem;
	}

	.shop-skill-label {
		font-size: 0.6rem;
		width: 3rem;
		color: var(--color-text-light);
	}

	.shop-skill-value {
		font-size: 0.6rem;
		min-width: 1.2rem;
		text-align: right;
		color: var(--color-text-light);
		font-weight: 600;
	}

	.shop-skill-bonus {
		color: #16a34a;
		font-weight: 700;
	}

	.skill-fill-bonus {
		background: #16a34a;
	}

	.shop-desc {
		font-size: 0.8rem;
		color: var(--color-text-light);
		margin-bottom: 0.25rem;
	}

	.event-card {
		background: #fef9c3;
		border-color: #fbbf24;
	}

	.event-card h4 {
		font-size: 0.8rem;
		color: #854d0e;
	}

	.event-card p {
		font-size: 0.8rem;
		color: #92400e;
	}

	.log-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.log-modal {
		width: 500px;
		max-width: 90vw;
		max-height: 70vh;
		display: flex;
		flex-direction: column;
		padding: 1rem 1.25rem;
		box-shadow: var(--shadow-lg);
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
	}

	.log-modal-scroll {
		flex: 1;
		overflow-y: auto;
		min-height: 0;
	}

	.log-entry {
		font-size: 0.75rem;
		padding: 0.15rem 0;
		border-bottom: 1px solid var(--color-border);
	}

	.log-round {
		font-weight: 700;
		margin-right: 0.25rem;
	}

	.log-success { color: #166534; }
	.log-warning { color: #854d0e; }
	.log-error { color: #991b1b; }
	.log-info { color: var(--color-text-light); }

	.btn-active {
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
		filter: brightness(0.9);
	}

	.training-badge {
		font-size: 0.65rem;
		background: #fef3c7;
		color: #92400e;
		padding: 0.1rem 0.4rem;
		border-radius: 4px;
		font-weight: 700;
		animation: pulse 1.5s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.6; }
	}

	.training-info {
		color: #b45309;
		font-weight: 600;
	}

	.sector-rep-row {
		display: flex;
		gap: 0.25rem;
		flex-wrap: wrap;
		margin-top: 0.25rem;
	}

	.sector-rep-badge {
		font-size: 0.6rem;
		padding: 0.05rem 0.3rem;
		border-radius: 3px;
		background: #ede9fe;
		color: #6d28d9;
		font-weight: 600;
	}

	.modal-desc {
		font-size: 0.82rem;
		color: var(--color-text-light);
		margin-bottom: 0.75rem;
		line-height: 1.5;
	}

	.sector-choice {
		text-align: center;
	}

	.sector-current {
		font-size: 0.8rem;
		color: var(--color-text-light);
	}

	.sector-after {
		font-size: 0.85rem;
		color: var(--color-success);
	}

	.sector-gain {
		font-size: 0.75rem;
		color: #16a34a;
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
		padding: 0.5rem 0.75rem;
		background: #f0f9ff;
		border-radius: 6px;
		border: 1px solid #bfdbfe;
	}

	.modal-info-item {
		font-size: 0.78rem;
		font-weight: 600;
		color: #1e40af;
		cursor: help;
		white-space: nowrap;
	}

	.supplier-bonus {
		font-size: 0.82rem;
		color: #16a34a;
		font-weight: 600;
		margin-bottom: 0.25rem;
		cursor: help;
	}

	.supplier-contracted {
		margin-top: 0.25rem;
		font-size: 0.68rem;
	}

	.sector-star {
		font-size: 0.7rem;
	}

	.shop-type {
		font-size: 0.7rem;
		margin-bottom: 0.25rem;
	}

	/* Tutorial overlay */
	.tutorial-overlay {
		position: fixed;
		inset: 0;
		z-index: 100;
		pointer-events: none;
	}

	.tutorial-card {
		position: absolute;
		background: var(--color-surface);
		border: 2px solid var(--color-accent);
		border-radius: 12px;
		padding: 1.25rem 1.5rem;
		max-width: 420px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25), 0 0 0 4000px rgba(0, 0, 0, 0.3);
		pointer-events: auto;
		animation: tutorial-appear 0.3s ease-out;
	}

	@keyframes tutorial-appear {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
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
		left: 280px;
	}

	.tutorial-bottom-right {
		bottom: 100px;
		right: 280px;
	}

	.tutorial-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.tutorial-step-badge {
		background: var(--color-accent);
		color: #1e293b;
		padding: 0.15rem 0.5rem;
		border-radius: 999px;
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		flex-shrink: 0;
	}

	.tutorial-header h3 {
		font-size: 1.05rem;
		margin: 0;
		color: var(--color-text);
	}

	.tutorial-card p {
		font-size: 0.9rem;
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
		font-size: 0.8rem;
		color: var(--color-accent);
		font-weight: 600;
		font-style: italic;
	}

	.tutorial-skip {
		font-size: 0.8rem;
		padding: 0.3rem 0.75rem;
		border-width: 1px;
		opacity: 0.7;
	}

	.tutorial-skip:hover {
		opacity: 1;
	}

	/* Impact Score Panel */
	.impact-score-panel {
		margin-top: 0.4rem;
		padding: 0.5rem;
		background: #f8fafc;
		border: 1px solid var(--color-border);
		border-radius: 6px;
	}

	.impact-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.35rem;
	}

	.dice-hint {
		font-size: 0.62rem;
		color: #9333ea;
		font-weight: 600;
	}

	.impact-rows {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.impact-row {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.68rem;
		padding: 0.1rem 0;
	}

	.impact-icon {
		width: 1.1rem;
		text-align: center;
		flex-shrink: 0;
		font-size: 0.72rem;
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
		color: #16a34a;
	}

	.impact-value.negative {
		color: #dc2626;
	}

	/* Shop costs */
	.shop-costs {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.2rem;
	}

	.shop-maintenance {
		color: #dc2626;
		font-size: 0.8rem;
		font-weight: 600;
	}

	.shop-type-traits {
		margin: 0.2rem 0;
	}

	.trait-badge {
		display: inline-block;
		padding: 0.15rem 0.4rem;
		border-radius: 4px;
		font-size: 0.68rem;
		font-weight: 700;
	}

	.trait-robot {
		background: #dbeafe;
		color: #1e40af;
	}

	.trait-human {
		background: #fef3c7;
		color: #92400e;
	}

	.type-hint {
		display: inline-block;
		padding: 0.1rem 0.4rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		margin-left: 0.25rem;
	}

	.type-hint-robot {
		background: #dbeafe;
		color: #1e40af;
	}

	.type-hint-human {
		background: #fef3c7;
		color: #92400e;
	}

	.safety-badge {
		display: inline-block;
		font-size: 0.55rem;
		padding: 0 0.2rem;
		border-radius: 3px;
		margin-left: 0.2rem;
		font-weight: 700;
	}

	.safety-low {
		background: #fecaca;
		color: #991b1b;
	}

	.safety-mid {
		background: #fef3c7;
		color: #854d0e;
	}

	.safety-high {
		background: #dcfce7;
		color: #166534;
	}

	.idle-badge {
		display: inline-block;
		font-size: 0.55rem;
		padding: 0 0.2rem;
		border-radius: 3px;
		margin-left: 0.2rem;
		font-weight: 700;
		background: #fef3c7;
		color: #92400e;
	}

	.assign-drag-hint {
		font-size: 0.72rem;
		color: var(--color-primary);
		font-style: italic;
		text-align: center;
		padding: 0.3rem;
		margin-top: 0.3rem;
		background: #eff6ff;
		border-radius: 4px;
	}

	.job-limit-msg {
		color: #dc2626;
		font-weight: 600;
	}

	.jobs-remaining {
		font-size: 0.65rem;
		color: var(--color-text-light);
		margin-top: 0.25rem;
		font-weight: 600;
	}

	.pending-assignment {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 0.4rem;
		padding: 0.35rem 0.5rem;
		background: #dbeafe;
		border: 1px solid #93c5fd;
		border-radius: 6px;
		font-size: 0.75rem;
		font-weight: 600;
		color: #1e40af;
	}

	.pending-remove {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 0.7rem;
		padding: 0.1rem 0.3rem;
		border-radius: 4px;
		opacity: 0.7;
	}

	.pending-remove:hover {
		opacity: 1;
		background: rgba(0, 0, 0, 0.08);
	}

	.btn-success {
		background: #16a34a;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: var(--radius);
		cursor: pointer;
		font-weight: 700;
		font-size: 0.85rem;
		animation: pulse 1.5s ease-in-out infinite;
	}

	.btn-success:hover {
		background: #15803d;
	}

	/* Job Result Popup */
	.jobresult-modal {
		width: 480px;
		max-width: 95vw;
		max-height: 85vh;
		overflow-y: auto;
		padding: 1.25rem 1.5rem;
		box-shadow: var(--shadow-lg);
	}

	.jobresult-header {
		margin-bottom: 1rem;
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 0.5rem;
	}

	.jobresult-header h3 {
		margin: 0;
		font-size: 1.1rem;
		color: var(--color-text);
		text-transform: none;
	}

	.jobresult-entry {
		padding: 0.75rem;
		border-radius: 8px;
		border: 1px solid var(--color-border);
		background: #fafafa;
	}

	.jobresult-entry.jobresult-success { border-color: #86efac; background: #f0fdf4; }
	.jobresult-entry.jobresult-partial { border-color: #fde68a; background: #fefce8; }
	.jobresult-entry.jobresult-failed { border-color: #fca5a5; background: #fef2f2; }
	.jobresult-entry.jobresult-error { border-color: #fca5a5; background: #fef2f2; }

	.jobresult-title-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.25rem;
	}

	.jobresult-job-name {
		font-weight: 700;
		font-size: 0.9rem;
		color: var(--color-text);
	}

	.jobresult-humanoid {
		font-size: 0.78rem;
		color: var(--color-text-light);
		margin-bottom: 0.5rem;
	}

	.jobresult-error-msg {
		font-size: 0.85rem;
		color: #dc2626;
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
		border-radius: 4px;
		padding-left: 0.25rem;
		padding-right: 0.25rem;
		transition: background 0.1s;
	}

	.jr-hoverable:hover {
		background: rgba(0, 0, 0, 0.04);
	}

	.jobresult-score-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.78rem;
		padding: 0.1rem 0;
		color: var(--color-text-light);
	}

	.jobresult-score-row.jobresult-base {
		font-weight: 600;
		color: var(--color-text);
	}

	.jobresult-score-row.jobresult-final {
		font-weight: 700;
		font-size: 0.9rem;
		color: var(--color-text);
	}

	.jobresult-final-value {
		font-size: 1.1rem;
		font-weight: 800;
	}

	.jr-positive { color: #16a34a; font-weight: 600; }
	.jr-negative { color: #dc2626; font-weight: 600; }

	.jobresult-divider {
		height: 1px;
		background: var(--color-border);
		margin: 0.3rem 0;
	}

	.jobresult-dice {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.4rem 0.6rem;
		border-radius: 6px;
		font-size: 0.82rem;
		font-weight: 700;
		margin: 0.25rem 0;
	}

	.jobresult-dice.dice-positive {
		background: #dcfce7;
		color: #166534;
	}

	.jobresult-dice.dice-negative {
		background: #fef2f2;
		color: #991b1b;
	}

	.jobresult-dice.dice-neutral {
		background: #f1f5f9;
		color: #64748b;
	}

	.dice-icon {
		font-size: 1.2rem;
	}

	.dice-label {
		flex: 1;
	}

	.dice-value {
		font-size: 0.9rem;
	}

	.jobresult-outcome {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.6rem 0.75rem;
		border-radius: 8px;
		margin-top: 0.25rem;
	}

	.jobresult-outcome.outcome-success {
		background: #dcfce7;
		border: 1px solid #86efac;
	}

	.jobresult-outcome.outcome-partial {
		background: #fef9c3;
		border: 1px solid #fde68a;
	}

	.jobresult-outcome.outcome-failed {
		background: #fef2f2;
		border: 1px solid #fca5a5;
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
		font-size: 0.9rem;
	}

	.outcome-rewards {
		display: flex;
		gap: 0.75rem;
		font-size: 0.8rem;
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

	/* End Turn Popup */
	.endturn-modal {
		width: 580px;
		max-width: 95vw;
		max-height: 85vh;
		overflow-y: auto;
		padding: 1.25rem 1.5rem;
		box-shadow: var(--shadow-lg);
	}

	.endturn-header {
		margin-bottom: 1rem;
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 0.5rem;
	}

	.endturn-header h3 {
		margin: 0;
		font-size: 1.1rem;
		color: var(--color-text);
		text-transform: none;
	}

	.endturn-table {
		margin-bottom: 1rem;
	}

	.endturn-row {
		display: grid;
		grid-template-columns: 180px 70px 80px 70px;
		gap: 0.5rem;
		align-items: center;
		padding: 0.3rem 0;
		border-bottom: 1px solid #f1f5f9;
	}

	.endturn-row-header {
		border-bottom: 2px solid var(--color-border);
		padding-bottom: 0.4rem;
		margin-bottom: 0.2rem;
	}

	.endturn-label-col {
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.endturn-cur-col {
		font-size: 0.85rem;
		font-weight: 600;
		text-align: center;
	}

	.endturn-arrow-col {
		font-size: 0.78rem;
		text-align: center;
	}

	.endturn-new-col {
		font-size: 0.85rem;
		font-weight: 600;
		text-align: center;
	}

	.endturn-row-header .endturn-label-col,
	.endturn-row-header .endturn-cur-col,
	.endturn-row-header .endturn-arrow-col,
	.endturn-row-header .endturn-new-col {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		color: var(--color-text-light);
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
		font-size: 0.7rem;
		line-height: 1.4;
	}

	.endturn-explain-sub {
		font-size: 0.62rem;
		color: var(--color-text-light);
		font-weight: 400;
		margin-left: 0.5rem;
	}

	.endturn-neutral-text {
		color: var(--color-text-light);
		font-style: italic;
	}

	.endturn-pos {
		color: #16a34a;
		font-weight: 600;
	}

	.endturn-neg {
		color: #dc2626;
		font-weight: 600;
	}

	.endturn-neutral {
		color: var(--color-text-light);
		opacity: 0.5;
	}

	.endturn-impact-detail {
		background: #f8fafc;
		border: 1px solid var(--color-border);
		border-radius: 8px;
		padding: 0.75rem;
		margin-bottom: 1rem;
	}

	.endturn-detail-title {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		color: var(--color-text-light);
		margin-bottom: 0.5rem;
	}

	.endturn-detail-grid {
		display: grid;
		grid-template-columns: 1fr auto auto auto;
		gap: 0.2rem 0.75rem;
		align-items: center;
	}

	.endturn-detail-header {
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		color: var(--color-text-light);
		text-align: center;
	}

	.endturn-detail-label {
		font-size: 0.78rem;
		color: var(--color-text);
	}

	.endturn-detail-val {
		font-size: 0.78rem;
		font-weight: 600;
		text-align: center;
		min-width: 3rem;
	}

	.endturn-detail-explain {
		grid-column: 1 / -1;
		font-size: 0.62rem;
		color: var(--color-text-light);
		font-style: italic;
		padding-left: 1.5rem;
		padding-bottom: 0.2rem;
	}

	.endturn-actions {
		display: flex;
		justify-content: space-between;
		gap: 0.75rem;
	}

	/* Podium Popup */
	.podium-modal {
		width: 600px;
		max-width: 95vw;
		max-height: 85vh;
		overflow-y: auto;
		padding: 1.5rem 2rem;
		box-shadow: var(--shadow-lg);
		text-align: center;
	}

	.podium-title {
		font-size: 1.5rem;
		margin: 0 0 1.25rem;
		color: var(--color-text);
	}

	.podium-stage {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.podium-entry {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border-radius: 10px;
		background: #f8fafc;
		border: 1px solid var(--color-border);
	}

	.podium-1 {
		background: #fefce8;
		border-color: #eab308;
		box-shadow: 0 0 12px rgba(234, 179, 8, 0.25);
	}

	.podium-2 {
		background: #f1f5f9;
		border-color: #94a3b8;
	}

	.podium-3 {
		background: #fdf4e8;
		border-color: #d97706;
	}

	.podium-off {
		opacity: 0.7;
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
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--color-text-light);
	}

	.podium-bar {
		flex: 1;
		border-radius: 8px;
		padding: 0.5rem 0.75rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.podium-player-name {
		font-weight: 700;
		font-size: 1.05rem;
	}

	.podium-score {
		font-weight: 700;
		font-size: 1rem;
		color: #b45309;
	}

	.podium-details {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		font-size: 0.72rem;
		text-align: left;
		min-width: 120px;
	}

	.podium-win {
		color: #16a34a;
		font-weight: 700;
	}

	.podium-lose {
		color: #dc2626;
		font-weight: 600;
	}

	.podium-actions {
		margin-top: 0.5rem;
	}
</style>
