<script module lang="ts">
	/** Geometry for the rings around the current primary node. */
	export interface RingState {
		/** The primary node's own color (its cluster color attribute). */
		color: string;
		/** The primary node's center in viewport pixels, relative to the graph container. */
		center: { x: number; y: number };
		/** One on-screen radius in pixels per ring, inner to outer. */
		radiusPx: number[];
	}

	/** Ring radius as a multiple of the primary node's own pixel radius. */
	export const RING_RADIUS_FACTORS = [1.2, 1.5];
	/** Hairline stroke width in pixels, matching the terminal-native line weight. */
	export const RING_STROKE_WIDTH = 2;
	/** Fraction of the ring circumference that is solid stroke; the rest is the spin gap. */
	export const RING_DASH_FILL_RATIO = 0.33;
	/** Spin duration in milliseconds per ring, inner to outer. */
	export const RING_SPIN_DURATIONS_MS = [1600,2400];
</script>

<script lang="ts">
	let {
		getRingState,
		revision,
	}: {
		getRingState: () => RingState | null;
		revision: number;
	} = $props();

	let state = $state<RingState | null>(null);

	$effect(() => {
		void getRingState;
		void revision;
		state = getRingState();
	});

	function dashArray(radius: number) {
		const circumference = 2 * Math.PI * Math.max(radius - RING_STROKE_WIDTH / 2, 1);
		const fill = circumference * RING_DASH_FILL_RATIO;
		return `${fill.toFixed(1)} ${(circumference - fill).toFixed(1)}`;
	}
</script>

{#if state}
	<div
		class="pointer-events-none absolute inset-0 overflow-hidden"
		aria-hidden="true"
		data-rings
		data-rings-state="visible"
		data-ring-color={state.color}
	>
		<div
			class="ring-anchor absolute"
			style:transform="translate({state.center.x}px, {state.center.y}px)"
		>
			{#each state.radiusPx as radius, index}
				<div
					class="ring-cell absolute"
					style:width="{radius * 2}px"
					style:height="{radius * 2}px"
					style:transform="translate(-50%, -50%)"
				>
					<svg
						class:ring-spin-reverse={index === 1}
						class="ring-spin"
						data-ring-index={index}
						style:width="{radius * 2}px"
						style:height="{radius * 2}px"
						style:--ring-duration="{RING_SPIN_DURATIONS_MS[index]}ms"
					>
						<circle
							cx={radius}
							cy={radius}
							r={radius - RING_STROKE_WIDTH / 2}
							fill="none"
							stroke={state.color}
							stroke-width={RING_STROKE_WIDTH}
							stroke-dasharray={dashArray(radius)}
						/>
					</svg>
				</div>
			{/each}
		</div>
	</div>
{/if}

<style>
	.ring-anchor,
	.ring-cell {
		top: 0;
		left: 0;
		will-change: transform;
	}

	.ring-spin,
	.ring-spin-reverse {
		transform-origin: 50% 50%;
		will-change: transform;
	}

	@media (prefers-reduced-motion: no-preference) {
		.ring-spin {
			animation: ring-spin-cw var(--ring-duration, 2400ms) linear infinite;
		}
		.ring-spin-reverse {
			animation: ring-spin-ccw var(--ring-duration, 1600ms) linear infinite;
		}
	}

	@keyframes ring-spin-cw {
		to {
			transform: rotate(360deg);
		}
	}

	@keyframes ring-spin-ccw {
		to {
			transform: rotate(-360deg);
		}
	}
</style>
