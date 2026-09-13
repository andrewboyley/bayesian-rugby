import { expect, test } from '@playwright/test';

interface PerformanceSnapshot {
	profile: string;
	antialiasEdges: boolean;
	edgeOpacity: number;
	enableEdgeEvents: boolean;
	pickingDownSizingRatio: number;
	edgePaths: string[];
	diagnostics: string[];
}

async function measureGpuTimerQuery(page: import('@playwright/test').Page) {
	return page.evaluate(async () => {
		const canvas = document.createElement('canvas');
		const gl = canvas.getContext('webgl2');
		const extension = gl?.getExtension('EXT_disjoint_timer_query_webgl2');
		if (!gl || !extension) {
			return { available: false, reason: 'EXT_disjoint_timer_query_webgl2 is unavailable' };
		}

		const query = gl.createQuery();
		if (!query) {
			return { available: false, reason: 'WebGL could not create a timer query' };
		}

		gl.beginQuery(extension.TIME_ELAPSED_EXT, query);
		gl.clearColor(0, 0, 0, 1);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.endQuery(extension.TIME_ELAPSED_EXT);

		const deadline = performance.now() + 2_000;
		while (performance.now() < deadline) {
			if (gl.getParameter(extension.GPU_DISJOINT_EXT)) {
				return { available: false, reason: 'GPU became disjoint during the timer query' };
			}
			if (gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE)) {
				return { available: true, gpuTimeMs: gl.getQueryParameter(query, gl.QUERY_RESULT) / 1_000_000 };
			}
			await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
		}

		return { available: false, reason: 'Timer query did not resolve within two seconds' };
	});
}

function percentile(samples: number[], percentage: number) {
	const sorted = [...samples].sort((first, second) => first - second);
	return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * percentage) - 1)];
}

async function measureGraph(page: import('@playwright/test').Page, path: string) {
	await page.goto(path, { waitUntil: 'domcontentloaded' });

	const viewer = page.getByLabel('Graph viewer');
	await expect(viewer.getByText('ready')).toBeVisible({ timeout: 30_000 });
	await expect(viewer.getByText('nodes 2085 · edges 4906')).toBeVisible();

	const canvas = viewer.locator('canvas').first();
	await expect(canvas).toBeVisible();
	await viewer.getByRole('button', { name: '[ center view ]' }).click();

	return page.evaluate(async () => {
		const frameIntervals = await new Promise<number[]>((resolve) => {
			const samples: number[] = [];
			let previousFrame: number | undefined;

			const recordFrame = (timestamp: number) => {
				if (previousFrame !== undefined) {
					samples.push(timestamp - previousFrame);
				}
				previousFrame = timestamp;
				if (samples.length === 60) {
					resolve(samples);
					return;
				}
				requestAnimationFrame(recordFrame);
			};

			requestAnimationFrame(recordFrame);
		});

		const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
		const dataset = performance
			.getEntriesByType('resource')
			.find((entry) => entry.name.endsWith('/wikipedia.json')) as PerformanceResourceTiming | undefined;
		const graphReady = performance.getEntriesByName('rugby-graph:graph-ready').at(-1);

		return {
			navigationMs: navigation.duration,
			datasetMs: dataset?.duration ?? null,
			graphReadyMs: graphReady?.startTime ?? null,
			frameIntervals,
			profile: (window as Window & { rugbyGraphPerformance?: PerformanceSnapshot }).rugbyGraphPerformance ?? null
		};
	});
}

const scenarios = [
	{ name: 'baseline', expected: { antialiasEdges: true, edgeOpacity: 0.3, enableEdgeEvents: false, pickingDownSizingRatio: 2 } },
	{ name: 'aliased', expected: { antialiasEdges: false, edgeOpacity: 0.3, enableEdgeEvents: false, pickingDownSizingRatio: 2 } },
	{ name: 'opaque', expected: { antialiasEdges: true, edgeOpacity: 1, enableEdgeEvents: false, pickingDownSizingRatio: 2 } },
	{ name: 'edge-events', expected: { antialiasEdges: true, edgeOpacity: 0.3, enableEdgeEvents: true, pickingDownSizingRatio: 2 } },
	{ name: 'coarse-picking', expected: { antialiasEdges: true, edgeOpacity: 0.3, enableEdgeEvents: false, pickingDownSizingRatio: 4 } }
];

for (const scenario of scenarios) {
	test(`measures ${scenario.name} graph rendering`, async ({ page }, testInfo) => {
		const metrics = await measureGraph(page, `/?performance=${scenario.name}`);

		const frameMetrics = {
			p50Ms: percentile(metrics.frameIntervals, 0.5),
			p95Ms: percentile(metrics.frameIntervals, 0.95),
			maxMs: Math.max(...metrics.frameIntervals)
		};
		const result = { ...metrics, frameMetrics };

		expect(result.graphReadyMs).not.toBeNull();
		expect(result.datasetMs).not.toBeNull();
		expect(result.frameMetrics.p50Ms).toBeGreaterThan(0);
		expect(result.profile).toMatchObject({ ...scenario.expected, edgePaths: ['line'] });
		await testInfo.attach('graph-performance.json', {
			body: JSON.stringify(result, null, 2),
			contentType: 'application/json'
		});
		console.log(JSON.stringify(result));
	});
}

test('enables Sigma diagnostics and reports WebGL GPU timer-query capability', async ({ page }, testInfo) => {
	await measureGraph(page, '/?perf=timers,stats,shaders,picking');
	const profile = await page.evaluate(() => (window as Window & { rugbyGraphPerformance?: PerformanceSnapshot }).rugbyGraphPerformance);
	const timerQuery = await measureGpuTimerQuery(page);

	expect(profile).toMatchObject({
		profile: 'baseline',
		diagnostics: expect.arrayContaining(['timers', 'stats', 'shaders', 'picking'])
	});
	if (timerQuery.available) {
		expect(timerQuery.gpuTimeMs).toBeGreaterThanOrEqual(0);
	} else {
		console.warn(`WebGL GPU timer query unavailable: ${timerQuery.reason}`);
	}
	await testInfo.attach('webgl-gpu-timer-query.json', {
		body: JSON.stringify(timerQuery, null, 2),
		contentType: 'application/json'
	});
});
