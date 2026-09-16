<script lang="ts">
	import { onMount } from 'svelte';

	type Coordinates = { x: number; y: number };

	let {
		viewportToGraph,
		revision,
	}: {
		viewportToGraph: ((coordinates: Coordinates) => Coordinates) | null;
		revision: number;
	} = $props();

	let canvas = $state<HTMLCanvasElement | null>(null);
	let step = $state(0);
	let yStep = $state(0);
	let cellWidth = $state(0);
	let cellHeight = $state(0);
	let originX = $state(0);
	let originY = $state(0);
	let xLabelCount = $state(0);
	let yLabelCount = $state(0);

	function chooseStep(unitsPerPixel: number) {
		const target = unitsPerPixel * 80;
		const magnitude = 10 ** Math.floor(Math.log10(target));
		return [1, 2, 5, 10].reduce((closest, factor) => {
			const candidate = factor * magnitude;
			return Math.abs(Math.log(candidate / target)) < Math.abs(Math.log(closest / target))
				? candidate
				: closest;
		}, magnitude);
	}

	function formatCoordinate(value: number, gridStep: number) {
		const precision = Math.max(0, -Math.floor(Math.log10(gridStep)));
		const rounded = Math.abs(value) < gridStep * 0.000001 ? 0 : value;
		return rounded.toFixed(precision);
	}

	function redraw() {
		if (!canvas || !viewportToGraph) return;

		const bounds = canvas.getBoundingClientRect();
		if (!bounds.width || !bounds.height) return;
		const pixelRatio = window.devicePixelRatio || 1;
		const width = Math.round(bounds.width * pixelRatio);
		const height = Math.round(bounds.height * pixelRatio);
		if (canvas.width !== width || canvas.height !== height) {
			canvas.width = width;
			canvas.height = height;
		}

		const context = canvas.getContext('2d');
		if (!context) return;
		context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
		context.clearRect(0, 0, bounds.width, bounds.height);

		const topLeft = viewportToGraph({ x: 0, y: 0 });
		const bottomRight = viewportToGraph({ x: bounds.width, y: bounds.height });
		const xSpan = bottomRight.x - topLeft.x;
		const ySpan = bottomRight.y - topLeft.y;
		if (!xSpan || !ySpan) return;

		const gridStep = chooseStep(Math.abs(xSpan / bounds.width));
		const gridCellWidth = Math.abs((gridStep / xSpan) * bounds.width);
		const gridCellHeight = gridCellWidth;
		const gridYStep = (gridCellHeight / bounds.height) * Math.abs(ySpan);
		const xMin = Math.min(topLeft.x, bottomRight.x);
		const xMax = Math.max(topLeft.x, bottomRight.x);
		const yMin = Math.min(topLeft.y, bottomRight.y);
		const yMax = Math.max(topLeft.y, bottomRight.y);
		const toViewportX = (x: number) => ((x - topLeft.x) / xSpan) * bounds.width;
		const toViewportY = (y: number) => ((y - topLeft.y) / ySpan) * bounds.height;
		const axisX = toViewportX(0);
		const axisY = toViewportY(0);
		const labelAxisX = Math.max(4, Math.min(bounds.width - 32, axisX));
		const labelAxisY = Math.max(12, Math.min(bounds.height - 4, axisY));

		context.lineWidth = 1;
		context.strokeStyle = 'rgba(253, 252, 252, 0.1)';
		context.beginPath();
		for (let x = Math.ceil(xMin / gridStep) * gridStep; x <= xMax; x += gridStep) {
			const viewportX = Math.round(toViewportX(x)) + 0.5;
			context.moveTo(viewportX, 0);
			context.lineTo(viewportX, bounds.height);
		}
		for (let y = Math.ceil(yMin / gridYStep) * gridYStep; y <= yMax; y += gridYStep) {
			const viewportY = Math.round(toViewportY(y)) + 0.5;
			context.moveTo(0, viewportY);
			context.lineTo(bounds.width, viewportY);
		}
		context.stroke();

		context.strokeStyle = 'rgba(253, 252, 252, 0.35)';
		context.beginPath();
		if (axisX >= 0 && axisX <= bounds.width) {
			context.moveTo(Math.round(axisX) + 0.5, 0);
			context.lineTo(Math.round(axisX) + 0.5, bounds.height);
		}
		if (axisY >= 0 && axisY <= bounds.height) {
			context.moveTo(0, Math.round(axisY) + 0.5);
			context.lineTo(bounds.width, Math.round(axisY) + 0.5);
		}
		context.stroke();

		context.fillStyle = 'rgba(253, 252, 252, 0.72)';
		context.font = '10px Berkeley Mono, JetBrains Mono, IBM Plex Mono, ui-monospace, monospace';
		let nextXLabelCount = 0;
		for (let x = Math.ceil(xMin / gridStep) * gridStep; x <= xMax; x += gridStep) {
			const viewportX = toViewportX(x);
			if (viewportX > 2 && viewportX < bounds.width - 32) {
				context.fillText(formatCoordinate(x, gridStep), viewportX + 4, labelAxisY - 4);
				nextXLabelCount += 1;
			}
		}
		let nextYLabelCount = 0;
		for (let y = Math.ceil(yMin / gridYStep) * gridYStep; y <= yMax; y += gridYStep) {
			const viewportY = toViewportY(y);
			if (viewportY > 10 && viewportY < bounds.height - 2) {
				context.fillText(formatCoordinate(y, gridYStep), labelAxisX + 4, viewportY - 4);
				nextYLabelCount += 1;
			}
		}

		step = gridStep;
		yStep = gridYStep;
		cellWidth = gridCellWidth;
		cellHeight = gridCellHeight;
		originX = axisX;
		originY = axisY;
		xLabelCount = nextXLabelCount;
		yLabelCount = nextYLabelCount;
	}

	$effect(() => {
		void viewportToGraph;
		void revision;
		redraw();
	});

	onMount(() => {
		const observer = new ResizeObserver(redraw);
		if (canvas) observer.observe(canvas);
		redraw();
		return () => observer.disconnect();
	});
</script>

<canvas
	bind:this={canvas}
	id="graph-grid"
	aria-hidden="true"
	class="pointer-events-none absolute inset-0 size-full"
	data-grid-step={step}
	data-grid-y-step={yStep}
	data-grid-cell-width={cellWidth}
	data-grid-cell-height={cellHeight}
	data-grid-origin-x={originX}
	data-grid-origin-y={originY}
	data-grid-x-label-count={xLabelCount}
	data-grid-y-label-count={yLabelCount}
></canvas>
