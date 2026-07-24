import {GlobalRegistrator} from '@happy-dom/global-registrator';

GlobalRegistrator.register();
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

import type {Types} from '@prequist/lanyard';
import {expect, test} from 'bun:test';
import React, {act} from 'react';
import {createRoot, type Root} from 'react-dom/client';
import {useLanyard} from '../src/index';

class FakeSocket {
	static instances: FakeSocket[] = [];

	OPEN = 1;
	readyState = 0;
	closed = false;
	sent: any[] = [];

	// The transport (sockittt) wires handlers via properties
	onopen: ((event: any) => void) | null = null;
	onmessage: ((event: any) => void) | null = null;
	onclose: ((event: any) => void) | null = null;
	onerror: ((event: any) => void) | null = null;

	constructor(
		public url: string,
		public protocols?: string | string[],
	) {
		FakeSocket.instances.push(this);
	}

	send(data: string) {
		this.sent.push(JSON.parse(data));
	}

	close(_code?: number, _reason?: string) {
		this.closed = true;
		this.readyState = 3;
	}

	// ---- test helpers ----

	message(msg: object) {
		this.onmessage?.({data: JSON.stringify(msg)});
	}

	hello() {
		this.readyState = 1;
		this.onopen?.({});
		this.message({op: 1, d: {heartbeat_interval: 30_000}});
	}
}

(globalThis as any).WebSocket = FakeSocket;
(window as any).WebSocket = FakeSocket;

const A = '111111111111111111' as Types.Snowflake;
const B = '222222222222222222' as Types.Snowflake;

const presence = (id: string, status: string) =>
	({
		discord_user: {id},
		discord_status: status,
	}) as unknown as Types.Presence;

function mount(children: React.ReactNode): Root {
	const root = createRoot(document.createElement('div'));
	act(() => root.render(children));
	return root;
}

test('hooks share one socket and only affected hooks re-render', () => {
	FakeSocket.instances = [];
	const api = {hostname: 'test-shared.example'};

	let rendersA = 0;
	let rendersB = 0;
	let rendersBoth = 0;
	let dataA: any;
	let dataB: any;
	let dataBoth: any;

	function CompA() {
		rendersA++;
		dataA = useLanyard(A, {api});
		return null;
	}

	function CompB() {
		rendersB++;
		dataB = useLanyard(B, {api});
		return null;
	}

	function CompBoth() {
		rendersBoth++;
		dataBoth = useLanyard([A, B], {api});
		return null;
	}

	const root = mount(
		<>
			<CompA />
			<CompB />
			<CompBoth />
		</>,
	);

	// Three hooks, one socket
	expect(FakeSocket.instances.length).toBe(1);
	const socket = FakeSocket.instances[0]!;

	act(() => socket.hello());

	// One Initialize for the whole deduplicated id set
	expect(socket.sent.filter(m => m.op === 2)).toEqual([
		{op: 2, d: {subscribe_to_ids: [A, B]}},
	]);

	const pa1 = presence(A, 'online');
	const pb1 = presence(B, 'idle');

	act(() =>
		socket.message({
			op: 0,
			t: 'INIT_STATE',
			d: {[A]: pa1, [B]: pb1},
		}),
	);

	// The socket JSON round-trips payloads, so compare by content and
	// then use the received references for identity assertions
	expect(dataA).toEqual(pa1);
	expect(dataB).toEqual(pb1);
	expect(dataBoth).toEqual({[A]: pa1, [B]: pb1});

	// A presence update for B must not re-render A's hook
	const beforeA = rendersA;
	const beforeB = rendersB;
	const beforeBoth = rendersBoth;
	const refA = dataA;
	const mapBefore = dataBoth;

	const pb2 = presence(B, 'dnd');
	act(() =>
		socket.message({op: 0, t: 'PRESENCE_UPDATE', d: pb2}),
	);

	expect(rendersA).toBe(beforeA);
	expect(dataA).toBe(refA);
	expect(rendersB).toBeGreaterThan(beforeB);
	expect(dataB).toEqual(pb2);
	expect(rendersBoth).toBeGreaterThan(beforeBoth);
	expect(dataBoth).toEqual({[A]: pa1, [B]: pb2});
	expect(dataBoth).not.toBe(mapBefore);
	expect(dataBoth[A]).toBe(refA);

	act(() => root.unmount());
	expect(socket.closed).toBe(true);
});

test('map hooks skip re-renders for unrelated ids on the same socket', () => {
	FakeSocket.instances = [];
	const api = {hostname: 'test-slices.example'};

	let rendersA = 0;
	let dataA: any;

	function CompA() {
		rendersA++;
		dataA = useLanyard([A], {api});
		return null;
	}

	function CompB() {
		useLanyard([B], {api});
		return null;
	}

	const root = mount(
		<>
			<CompA />
			<CompB />
		</>,
	);

	const socket = FakeSocket.instances[0]!;
	act(() => socket.hello());

	const pa1 = presence(A, 'online');
	const pb1 = presence(B, 'idle');
	act(() =>
		socket.message({
			op: 0,
			t: 'INIT_STATE',
			d: {[A]: pa1, [B]: pb1},
		}),
	);

	const before = rendersA;
	const mapBefore = dataA;

	act(() =>
		socket.message({
			op: 0,
			t: 'PRESENCE_UPDATE',
			d: presence(B, 'offline'),
		}),
	);

	// B updated, but A's map slice is untouched: same reference, no render
	expect(rendersA).toBe(before);
	expect(dataA).toBe(mapBefore);

	act(() => root.unmount());
});

test('per-hook initialData stays isolated and converges on socket data', () => {
	FakeSocket.instances = [];
	const api = {hostname: 'test-initial.example'};

	const initialX = presence(A, 'online');
	const initialY = presence(A, 'idle');

	let dataX: any;
	let dataY: any;
	let dataZ: any;

	function CompX() {
		dataX = useLanyard(A, {api, initialData: initialX});
		return null;
	}

	function CompY() {
		dataY = useLanyard(A, {api, initialData: initialY});
		return null;
	}

	function CompZ() {
		dataZ = useLanyard(A, {api});
		return null;
	}

	const root = mount(
		<>
			<CompX />
			<CompY />
			<CompZ />
		</>,
	);

	// Each hook sees its own initialData; no cross-contamination
	expect(dataX).toBe(initialX);
	expect(dataY).toBe(initialY);
	expect(dataZ).toBeUndefined();

	const socket = FakeSocket.instances[0]!;
	act(() => socket.hello());

	const live = presence(A, 'dnd');
	act(() =>
		socket.message({
			op: 0,
			t: 'INIT_STATE',
			d: {[A]: live},
		}),
	);

	// All hooks converge on the same server truth
	expect(dataX).toEqual(live);
	expect(dataY).toBe(dataX);
	expect(dataZ).toBe(dataX);

	act(() => root.unmount());
});

test('refcounting keeps the socket while any subscriber remains', () => {
	FakeSocket.instances = [];
	const api = {hostname: 'test-refcount.example'};

	function Sub({ids}: {ids: readonly Types.Snowflake[]}) {
		useLanyard(ids, {api});
		return null;
	}

	const rootA = mount(<Sub ids={[A]} />);
	const rootB = mount(<Sub ids={[A, B]} />);

	expect(FakeSocket.instances.length).toBe(1);
	const socket = FakeSocket.instances[0]!;
	act(() => socket.hello());

	// Dropping the [A, B] hook unsubscribes only B; socket stays open
	act(() => rootB.unmount());
	expect(socket.closed).toBe(false);
	expect(socket.sent.filter(m => m.op === 4)).toEqual([
		{op: 4, d: {unsubscribe_from_ids: [B]}},
	]);

	// Dropping the last hook closes the socket
	act(() => rootA.unmount());
	expect(socket.closed).toBe(true);
});

/**
 * Compile-time only: ids provided in initialData are guaranteed in
 * the returned map, everything else stays optional.
 */
function typeChecks() {
	function Comp() {
		const partial = useLanyard(
			['111111111111111111', '222222222222222222'],
			{
				initialData: {
					'111111111111111111': presence(A, 'online'),
				},
			},
		);

		// Provided in initialData, so it can never be undefined
		const guaranteed: Types.Presence =
			partial['111111111111111111'];

		// @ts-expect-error not in initialData, so it may be undefined
		const notGuaranteed: Types.Presence =
			partial['222222222222222222'];

		const full = useLanyard(
			['111111111111111111', '222222222222222222'],
			{
				initialData: {
					'111111111111111111': presence(A, 'online'),
					'222222222222222222': presence(B, 'idle'),
				},
			},
		);

		// Every subscribed id was provided, so the whole map is complete
		const complete: Types.Presence =
			full['222222222222222222'];

		// The hook returns the presence itself, not a wrapper
		const direct = useLanyard('111111111111111111');
		// @ts-expect-error there is no {data, isLoading} object
		const notWrapped = direct.isLoading;

		return [
			guaranteed,
			notGuaranteed,
			complete,
			notWrapped,
		];
	}

	return Comp;
}

void typeChecks;
