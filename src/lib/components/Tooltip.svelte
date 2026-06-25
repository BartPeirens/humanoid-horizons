<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		text = '',
		children,
		content,
		position = 'top',
	}: {
		text?: string;
		children: Snippet;
		content?: Snippet;
		position?: 'top' | 'bottom' | 'left' | 'right';
	} = $props();

	let visible = $state(false);
	let tooltipEl: HTMLElement;
	let wrapperEl: HTMLElement;
	let coords = $state({ x: 0, y: 0 });

	function show() {
		visible = true;
		updatePosition();
	}

	function hide() {
		visible = false;
	}

	function updatePosition() {
		if (!wrapperEl) return;
		const rect = wrapperEl.getBoundingClientRect();
		const pad = 8;

		switch (position) {
			case 'top':
				coords = { x: rect.left + rect.width / 2, y: rect.top - pad };
				break;
			case 'bottom':
				coords = { x: rect.left + rect.width / 2, y: rect.bottom + pad };
				break;
			case 'left':
				coords = { x: rect.left - pad, y: rect.top + rect.height / 2 };
				break;
			case 'right':
				coords = { x: rect.right + pad, y: rect.top + rect.height / 2 };
				break;
		}
	}
</script>

<span
	class="tooltip-wrapper"
	bind:this={wrapperEl}
	onmouseenter={show}
	onmouseleave={hide}
	onfocus={show}
	onblur={hide}
>
	{@render children()}

	{#if visible && (text || content)}
		<div
			class="tooltip tooltip-{position}"
			bind:this={tooltipEl}
			style="left: {coords.x}px; top: {coords.y}px;"
			role="tooltip"
		>
			<div class="tooltip-inner">
				{#if content}
					{@render content()}
				{:else}
					{text}
				{/if}
			</div>
			<div class="tooltip-arrow"></div>
		</div>
	{/if}
</span>

<style>
	.tooltip-wrapper {
		display: inline-flex;
		position: relative;
	}

	.tooltip {
		position: fixed;
		z-index: 1000;
		pointer-events: none;
		animation: tooltip-fade 0.15s ease-out;
	}

	@keyframes tooltip-fade {
		from { opacity: 0; transform: scale(0.95); }
		to { opacity: 1; transform: scale(1); }
	}

	.tooltip-inner {
		background: #1e293b;
		color: #f1f5f9;
		padding: 0.5rem 0.75rem;
		border-radius: 8px;
		font-size: 0.75rem;
		line-height: 1.5;
		max-width: 280px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05);
		text-align: left;
		word-wrap: break-word;
	}

	.tooltip-inner :global(strong) {
		color: #fbbf24;
		font-weight: 700;
	}

	.tooltip-inner :global(.tt-label) {
		color: #94a3b8;
		font-size: 0.65rem;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		display: block;
		margin-bottom: 0.15rem;
	}

	.tooltip-inner :global(.tt-value) {
		color: #e2e8f0;
		font-weight: 600;
	}

	.tooltip-inner :global(.tt-positive) {
		color: #4ade80;
	}

	.tooltip-inner :global(.tt-negative) {
		color: #f87171;
	}

	.tooltip-inner :global(.tt-divider) {
		height: 1px;
		background: rgba(255, 255, 255, 0.1);
		margin: 0.35rem 0;
	}

	.tooltip-inner :global(.tt-row) {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.1rem 0;
	}

	.tooltip-arrow {
		position: absolute;
		width: 8px;
		height: 8px;
		background: #1e293b;
		transform: rotate(45deg);
	}

	.tooltip-top {
		transform: translate(-50%, -100%);
	}
	.tooltip-top .tooltip-arrow {
		bottom: -4px;
		left: 50%;
		margin-left: -4px;
	}

	.tooltip-bottom {
		transform: translate(-50%, 0);
	}
	.tooltip-bottom .tooltip-arrow {
		top: -4px;
		left: 50%;
		margin-left: -4px;
	}

	.tooltip-left {
		transform: translate(-100%, -50%);
	}
	.tooltip-left .tooltip-arrow {
		right: -4px;
		top: 50%;
		margin-top: -4px;
	}

	.tooltip-right {
		transform: translate(0, -50%);
	}
	.tooltip-right .tooltip-arrow {
		left: -4px;
		top: 50%;
		margin-top: -4px;
	}
</style>
