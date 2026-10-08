import {
	getLanyardClient,
	type PresenceMap,
	type Types,
} from '@prequist/lanyard';
import {
	useCallback,
	useEffect,
	useRef,
	useSyncExternalStore,
} from 'react';
import {DEFAULT_OPTIONS, type Options} from '../types';

/**
 * Keys that `I` provides as required, non-undefined
 * properties. Optional keys are excluded — a value typed
 * `Partial<PresenceMap>` guarantees nothing, even though
 * `keyof` still lists its keys.
 */
type ProvidedKeys<I> = {
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- `{}` is the standard optional-key test
	[K in keyof I]-?: {} extends Pick<I, K> ? never : K;
}[keyof I];

/**
 * The return type of a multi-snowflake `useLanyard` given
 * the `initialData` type `I`: ids that `I` definitely
 * provides can never be absent from the result (live data
 * only ever overwrites them), so they are typed as
 * always-present, while the remaining subscribed ids stay
 * optional. Providing a presence for every subscribed id
 * therefore makes the whole map complete.
 */
export type PresenceMapWithInitial<
	S extends Types.Snowflake,
	I extends Partial<PresenceMap<S>>,
> = PresenceMap<Extract<S, ProvidedKeys<I>>> &
	Partial<PresenceMap<Exclude<S, ProvidedKeys<I>>>>;

function shallowEqualPresences(
	a: Partial<PresenceMap>,
	b: Partial<PresenceMap>,
): boolean {
	const aKeys = Object.keys(a) as Types.Snowflake[];

	if (aKeys.length !== Object.keys(b).length) {
		return false;
	}

	// Presences are replaced immutably in the snapshot, so
	// reference equality per id is an exact "did this
	// presence change" check
	return aKeys.every(key => Object.is(a[key], b[key]));
}

export function useLanyard<
	const S extends readonly Types.Snowflake[],
	const I extends Partial<PresenceMap<S[number]>>,
>(
	snowflakes: S,
	options: Partial<
		Options<Partial<PresenceMap<S[number]>>>
	> & {
		initialData: I;
	},
): PresenceMapWithInitial<S[number], I>;
export function useLanyard<
	const S extends readonly Types.Snowflake[],
>(
	snowflakes: S,
	options?: Partial<
		Options<Partial<PresenceMap<S[number]>>>
	>,
): Partial<PresenceMap<S[number]>> | undefined;
export function useLanyard(
	snowflake: Types.Snowflake,
	options: Partial<Options> & {
		initialData: NonNullable<Options['initialData']>;
	},
): Types.Presence;
export function useLanyard(
	snowflake: Types.Snowflake,
	options?: Partial<Options>,
): Types.Presence | undefined;
export function useLanyard(
	snowflake: Types.Snowflake | readonly Types.Snowflake[],
	userOptions?: Partial<
		Options<Types.Presence | Partial<PresenceMap>>
	>,
): Types.Presence | Partial<PresenceMap> | undefined {
	const options = {
		...DEFAULT_OPTIONS,
		...userOptions,
	};

	const initialData = options.initialData;
	const isMulti = Array.isArray(snowflake);

	const client = getLanyardClient(options.api);

	/**
	 * Stable identity for the subscription, so passing an
	 * inline array does not resubscribe every render.
	 */
	const subscriptionKey = Array.isArray(snowflake)
		? snowflake.join(',')
		: (snowflake as Types.Snowflake);

	useEffect(() => {
		return client.subscribe(
			isMulti ? snowflake : [snowflake],
		);
		// `snowflake` is captured, but `subscriptionKey` covers its identity
	}, [client, subscriptionKey]);

	const subscribe = useCallback(
		(listener: () => void) => client.listen(listener),
		[client],
	);

	const cacheRef = useRef<{
		source: Partial<PresenceMap>;
		key: string;
		result:
			Types.Presence | Partial<PresenceMap> | undefined;
	}>(undefined);

	/**
	 * Selects this hook's slice of the shared snapshot.
	 * Serves as `getSnapshot` for useSyncExternalStore, so
	 * it must return a reference-equal value when the
	 * slice hasn't changed — that is what lets React skip
	 * re-rendering this hook when an unrelated snowflake
	 * on the same client updates.
	 */
	const get = ():
		Types.Presence | Partial<PresenceMap> | undefined => {
		const source = client.getSnapshot();
		const cached = cacheRef.current;

		if (
			cached &&
			cached.source === source &&
			cached.key === subscriptionKey
		) {
			return cached.result;
		}

		let result:
			Types.Presence | Partial<PresenceMap> | undefined;

		if (Array.isArray(snowflake)) {
			const initial = initialData as
				Partial<PresenceMap> | undefined;

			let next: Partial<PresenceMap> | undefined = initial
				? {...initial}
				: undefined;

			for (const id of snowflake as readonly Types.Snowflake[]) {
				const presence = source[id];

				if (presence) {
					next ??= {};
					next[id] = presence;
				}
			}

			result = next;

			// Keep the previous object if the slice is
			// content-equal so React can bail out of the
			// re-render
			if (cached && cached.key === subscriptionKey) {
				const previous = cached.result as
					Partial<PresenceMap> | undefined;

				if (
					previous &&
					next &&
					shallowEqualPresences(previous, next)
				) {
					result = previous;
				}
			}
		} else {
			result =
				source[snowflake as Types.Snowflake] ??
				(initialData as Types.Presence | undefined);
		}

		cacheRef.current = {
			source,
			key: subscriptionKey,
			result,
		};

		return result;
	};

	return useSyncExternalStore(subscribe, get, get);
}
