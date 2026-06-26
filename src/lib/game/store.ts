import { writable, derived, get } from 'svelte/store';
import type { GameState, GameAction, ActionResult } from './types.js';
import { createGame, processAction } from './engine.js';
import { TUTORIAL_STEPS, type TutorialStep } from './tutorial.js';

export const gameState = writable<GameState | null>(null);
export const lastMessage = writable<string>('');

export const tutorialActive = writable<boolean>(false);
export const tutorialStepIndex = writable<number>(0);

export const currentTutorialStep = derived(
	[tutorialActive, tutorialStepIndex],
	([$active, $index]): TutorialStep | null => {
		if (!$active) return null;
		return TUTORIAL_STEPS[$index] ?? null;
	}
);

export const currentPlayer = derived(gameState, ($state) => {
	if (!$state) return null;
	return $state.players[$state.currentPlayerIndex];
});

export const isGameActive = derived(gameState, ($state) => {
	return $state?.status === 'active';
});

export function startNewGame(playerCount: number, playerNames?: string[], withTutorial: boolean = false) {
	const state = createGame(playerCount, playerNames);
	gameState.set(state);
	lastMessage.set(`Spel gestart met ${playerCount} spelers! Ronde 1 begint.`);

	if (withTutorial) {
		tutorialActive.set(true);
		tutorialStepIndex.set(0);
	} else {
		tutorialActive.set(false);
	}
}

export function advanceTutorial() {
	const currentIndex = get(tutorialStepIndex);
	const nextIndex = currentIndex + 1;

	if (nextIndex >= TUTORIAL_STEPS.length) {
		completeTutorial();
	} else {
		tutorialStepIndex.set(nextIndex);
	}
}

export function completeTutorial() {
	tutorialActive.set(false);
	tutorialStepIndex.set(0);

	const state = get(gameState);
	if (state) {
		const freshState = createGame(state.players.length, state.players.map(p => p.name));
		gameState.set(freshState);
		lastMessage.set('Tutorial voltooid! Het echte spel begint nu bij ronde 1.');
	}
}

export function skipTutorial() {
	tutorialActive.set(false);
	tutorialStepIndex.set(0);
	lastMessage.set('Tutorial overgeslagen. Veel succes!');
}

export function previewAction(action: GameAction): ActionResult | null {
	const state = get(gameState);
	if (!state) return null;
	return processAction(state, action);
}

export function performAction(action: GameAction): ActionResult | null {
	const state = get(gameState);
	if (!state) return null;

	const result = processAction(state, action);
	lastMessage.set(result.message);
	if (result.success) {
		gameState.set(result.updatedState);
	}
	return result;
}

export function resetGame() {
	gameState.set(null);
	lastMessage.set('');
	tutorialActive.set(false);
	tutorialStepIndex.set(0);
}
