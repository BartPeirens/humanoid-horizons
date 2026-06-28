<script lang="ts">
	import { startNewGame } from '$lib/game/store';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import logo from '$lib/assets/logo.svg';

	let playerCount = $state(2);
	let playerNames = $state(['', '', '', '']);
	let showSetup = $state(false);
	let withTutorial = $state(false);

	function handleStart() {
		const names = playerNames.slice(0, playerCount).map((n, i) => n.trim() || `Speler ${i + 1}`);
		startNewGame(playerCount, names, withTutorial);
		goto(`${base}/game`);
	}
</script>

<div class="home">
	<div class="hero">
		<div class="hero-content">
			<div class="title-row">
				<img src={logo} alt="Humanoid Horizons logo" class="logo" />
				<h1 class="title">Humanoid Horizons</h1>
			</div>
			<p class="subtitle">Bouw het slimste humanoid-bedrijf ter wereld</p>
			<p class="description">
				Een strategisch bordspel waar je humanoids inzet, leveranciers kiest,
				compliance beheert en je bedrijf uitbreidt over 6 continenten.
			</p>

			{#if !showSetup}
				<div class="cta-buttons">
					<button class="btn-primary btn-lg" onclick={() => showSetup = true}>
						Nieuw spel starten
					</button>
					<a href="{base}/how-to-play" class="btn-outline btn-lg">Spelregels</a>
				</div>
			{:else}
				<div class="setup-panel card">
					<h2>Nieuw spel</h2>

					<div class="player-count">
						<label>Aantal spelers:</label>
						<div class="count-buttons">
							{#each [1, 2, 3, 4] as count}
								<button
									class={playerCount === count ? 'btn-primary' : 'btn-outline'}
									onclick={() => playerCount = count}
								>
									{count}
								</button>
							{/each}
						</div>
					</div>

					<div class="player-names">
						{#each Array(playerCount) as _, i}
							<div class="name-input">
								<label>Speler {i + 1}:</label>
								<input
									type="text"
									placeholder={`Speler ${i + 1}`}
									bind:value={playerNames[i]}
								/>
							</div>
						{/each}
					</div>

					<div class="tutorial-toggle">
						<label class="toggle-label">
							<input type="checkbox" bind:checked={withTutorial} />
							<span>Tutorial spelen (begeleide oefenronde)</span>
						</label>
					</div>

					<div class="setup-actions">
						<button class="btn-primary btn-lg" onclick={handleStart}>
							{withTutorial ? 'Start met tutorial' : 'Start!'}
						</button>
						<button class="btn-outline" onclick={() => showSetup = false}>Annuleren</button>
					</div>
				</div>
			{/if}
		</div>

		<div class="hero-visual">
			<div class="floating-icons">
				<span class="icon" style="--delay: 0s; --x: 20%; --y: 30%;">&#x1F916;</span>
				<span class="icon" style="--delay: 1s; --x: 70%; --y: 20%;">&#x1F3D7;</span>
				<span class="icon" style="--delay: 2s; --x: 40%; --y: 60%;">&#x1F30D;</span>
				<span class="icon" style="--delay: 0.5s; --x: 80%; --y: 70%;">&#x1F4B0;</span>
				<span class="icon" style="--delay: 1.5s; --x: 15%; --y: 75%;">&#x2B50;</span>
				<span class="icon" style="--delay: 2.5s; --x: 55%; --y: 40%;">&#x1F4CB;</span>
			</div>
		</div>
	</div>

	<div class="features">
		<div class="feature card">
			<h3>Strategie</h3>
			<p>Kies slim welke humanoids je koopt en waar je ze inzet. Elke opdracht heeft specifieke vereisten.</p>
		</div>
		<div class="feature card">
			<h3>Wereldwijd</h3>
			<p>Breid uit naar 6 continenten, elk met eigen regelgeving, risico's en kansen.</p>
		</div>
		<div class="feature card">
			<h3>Multiplayer</h3>
			<p>Speel met 1 tot 4 spelers op hetzelfde scherm. Wie bouwt het beste humanoid-bedrijf?</p>
		</div>
	</div>
</div>

<style>
	.home {
		min-height: 100vh;
		padding: 2rem;
		background: radial-gradient(ellipse at 30% 20%, rgba(56, 189, 248, 0.06), transparent 60%),
					radial-gradient(ellipse at 70% 80%, rgba(167, 139, 250, 0.05), transparent 50%),
					var(--color-bg);
	}

	.hero {
		max-width: 900px;
		margin: 0 auto;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		align-items: center;
		min-height: 70vh;
	}

	.title-row {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 0.5rem;
	}

	.logo {
		width: 64px;
		height: 64px;
		flex-shrink: 0;
		filter: drop-shadow(0 0 12px rgba(56, 189, 248, 0.35));
	}

	.title {
		font-family: var(--font-display);
		font-size: 2.6rem;
		margin-bottom: 0;
		background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		letter-spacing: 0.04em;
	}

	.subtitle {
		font-size: 1.15rem;
		color: var(--color-text-light);
		margin-bottom: 1rem;
	}

	.description {
		color: var(--color-text-muted);
		line-height: 1.65;
		margin-bottom: 2rem;
	}

	.cta-buttons {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.cta-buttons a {
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		background: transparent;
		color: var(--color-primary);
		border: 1.5px solid var(--color-primary);
		border-radius: var(--radius-lg);
		padding: 0.75rem 2rem;
		font-size: 1.05rem;
		font-weight: 600;
		transition: all var(--transition-fast);
	}

	.cta-buttons a:hover {
		background: var(--color-primary-subtle);
		box-shadow: var(--shadow-glow-primary);
	}

	.setup-panel {
		padding: 1.5rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}

	.setup-panel h2 {
		margin-bottom: 1rem;
		color: var(--color-text);
	}

	.player-count {
		margin-bottom: 1rem;
	}

	.player-count label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
		color: var(--color-text-light);
	}

	.count-buttons {
		display: flex;
		gap: 0.5rem;
	}

	.player-names {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.name-input {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.name-input label {
		min-width: 5rem;
		font-weight: 500;
		color: var(--color-text-light);
	}

	.name-input input {
		flex: 1;
		padding: 0.45rem 0.8rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		font-size: 0.88rem;
		background: var(--color-surface-elevated);
		color: var(--color-text);
		transition: border-color var(--transition-fast);
	}

	.name-input input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 2px var(--color-primary-glow);
	}

	.tutorial-toggle {
		margin-bottom: 1rem;
	}

	.toggle-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		font-size: 0.88rem;
		color: var(--color-text-light);
	}

	.toggle-label input[type="checkbox"] {
		width: 1.1rem;
		height: 1.1rem;
		accent-color: var(--color-primary);
	}

	.setup-actions {
		display: flex;
		gap: 0.75rem;
	}

	.hero-visual {
		position: relative;
		height: 300px;
	}

	.floating-icons {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.icon {
		position: absolute;
		font-size: 2.5rem;
		left: var(--x);
		top: var(--y);
		animation: float 3s ease-in-out infinite;
		animation-delay: var(--delay);
		filter: drop-shadow(0 0 8px rgba(56, 189, 248, 0.2));
	}

	@keyframes float {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-15px); }
	}

	.features {
		max-width: 900px;
		margin: 2rem auto;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.5rem;
	}

	.feature {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 1.25rem;
		transition: all var(--transition-fast);
	}

	.feature:hover {
		border-color: rgba(56, 189, 248, 0.2);
		box-shadow: var(--shadow-glow-primary);
		transform: translateY(-2px);
	}

	.feature h3 {
		color: var(--color-primary);
		margin-bottom: 0.5rem;
		font-family: var(--font-display);
		font-size: 0.9rem;
		letter-spacing: 0.04em;
	}

	.feature p {
		color: var(--color-text-muted);
		font-size: 0.88rem;
		line-height: 1.55;
	}

	@media (max-width: 768px) {
		.hero {
			grid-template-columns: 1fr;
		}
		.hero-visual {
			display: none;
		}
		.features {
			grid-template-columns: 1fr;
		}
		.title {
			font-size: 1.8rem;
		}
	}
</style>
