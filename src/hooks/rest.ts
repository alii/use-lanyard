import type {Types} from '@prequist/lanyard';
import {useCallback, useEffect, useSyncExternalStore} from 'react';
import {type State, useLanyardContext} from '../context/context';
import {DEFAULT_OPTIONS, type Options} from '../types';
import {get} from '../utils/get';
import {useEvent} from './use-event';

export type UseLanyardReturn = State & {
	revalidate(): Promise<void>;
};

export function useLanyard(
	snowflake: Types.Snowflake,
	userOptions?: Partial<Options>,
): UseLanyardReturn {
	const options: Options = {
		...DEFAULT_OPTIONS,
		...userOptions,
	};

	const context = useLanyardContext();

	const dispatch = useEvent((data: State) => {
		context.stateMap.set(snowflake, data);

		for (const listener of context.listeners) {
			listener();
		}
	});

	const getState = useEvent(() => {
		const data = context.stateMap.get(snowflake, options.initialData);

		if (!data) {
			throw new Error('State not found');
		}

		return data;
	});

	const loading = useEvent((isLoading: boolean) => {
		dispatch({...getState(), isLoading});
	});

	const revalidate = useEvent(async (controller?: AbortController) => {
		if (getState().isLoading) {
			return;
		}

		loading(true);

		const result = await get(
			snowflake,
			controller ? {...options, controller} : options,
		);

		if (result.error) {
			dispatch({
				...getState(),
				state: 'errored',
				error: result.error,
				isLoading: false,
			});
		} else {
			dispatch({
				...getState(),
				state: 'loaded',
				data: result.data,
				isLoading: false,
			});
		}
	});

	useEffect(() => {
		const controller = new AbortController();

		void revalidate(controller);

		return () => {
			controller.abort();
		};
	}, [revalidate]);

	const subscribe = useCallback(
		(fn: () => void) => {
			context.listeners.add(fn);

			return () => {
				context.listeners.delete(fn);
			};
		},
		[snowflake],
	);

	const state = useSyncExternalStore(subscribe, getState, getState);

	return {...state, revalidate};
}
