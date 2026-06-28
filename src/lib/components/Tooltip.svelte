<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onDestroy } from 'svelte';

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
	let wrapperEl: HTMLElement;
	let coords = $state({ x: 0, y: 0 });

	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return {
			destroy() {
				if (node.parentNode) {
					node.parentNode.removeChild(node);
				}
			}
		};
	}

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
</span>

{#if visible && (text || content)}
	<div
		class="tooltip tooltip-{position}"
		style="left: {coords.x}px; top: {coords.y}px;"
		role="tooltip"
		use:portal
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

<style>
	.tooltip-wrapper {
		display: inline-flex;
		position: relative;
	}

	:global(.tooltip) {
		position: fixed;
		z-index: 99999;
		pointer-events: none;
		animation: tooltip-fade 0.2s cubic-bezier(0.16, 1, 0.3, 1);
	}

	@keyframes tooltip-fade {
		from { opacity: 0; transform: scale(0.92) translateY(4px); }
		to { opacity: 1; transform: scale(1) translateY(0); }
	}

	:global(.tooltip-inner) {
		background: linear-gradient(135deg, #0f1d32, #142140);
		color: #d4dce8;
		padding: 0.6rem 0.85rem;
		border-radius: 10px;
		font-size: 0.75rem;
		line-height: 1.55;
		max-width: 300px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(56, 189, 248, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.06);
		text-align: left;
		word-wrap: break-word;
	}

	:global(.tooltip-inner strong) {
		color: #fbbf24;
		font-weight: 700;
	}

	:global(.tooltip-inner .tt-label) {
		color: #38bdf8;
		font-size: 0.62rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-weight: 700;
		display: block;
		margin-bottom: 0.2rem;
	}

	:global(.tooltip-inner .tt-value) {
		color: #e2e8f0;
		font-weight: 600;
	}

	:global(.tooltip-inner .tt-positive) {
		color: #34d399;
	}

	:global(.tooltip-inner .tt-negative) {
		color: #f87171;
	}

	:global(.tooltip-inner .tt-divider) {
		height: 1px;
		background: linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.15), transparent);
		margin: 0.4rem 0;
	}

	:global(.tooltip-inner .tt-row) {
		display: flex;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.12rem 0;
	}

	:global(.tooltip-arrow) {
		position: absolute;
		width: 8px;
		height: 8px;
		background: #0f1d32;
		transform: rotate(45deg);
		border: 1px solid rgba(56, 189, 248, 0.1);
	}

	:global(.tooltip-top) {
		transform: translate(-50%, -100%);
	}
	:global(.tooltip-top .tooltip-arrow) {
		bottom: -4px;
		left: 50%;
		margin-left: -4px;
		border-top: none;
		border-left: none;
	}

	:global(.tooltip-bottom) {
		transform: translate(-50%, 0);
	}
	:global(.tooltip-bottom .tooltip-arrow) {
		top: -4px;
		left: 50%;
		margin-left: -4px;
		border-bottom: none;
		border-right: none;
	}

	:global(.tooltip-left) {
		transform: translate(-100%, -50%);
	}
	:global(.tooltip-left .tooltip-arrow) {
		right: -4px;
		top: 50%;
		margin-top: -4px;
		border-bottom: none;
		border-left: none;
	}

	:global(.tooltip-right) {
		transform: translate(0, -50%);
	}
	:global(.tooltip-right .tooltip-arrow) {
		left: -4px;
		top: 50%;
		margin-top: -4px;
		border-top: none;
		border-right: none;
	}
</style>
