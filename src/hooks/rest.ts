import {useCallback, useEffect, useState} from 'react';
import {ContextData, useLanyardContext} from '../context/context';
import {API, DEFAULT_OPTIONS, Options, Snowflake} from '../types';
import {get, getURL} from './get';

export type UseLanyardReturn = ContextData & {
	revalidate(): Promise<void>;
};

export class LanyardError extends Error {
	public readonly code: number;

	constructor(
		public readonly request: Request,
		public readonly response: Response,
		public readonly body: API.ErroredAPIResponse,
	) {
		super(body.error.message);
		this.code = this.response.status;
	}
}

export function useLanyard(
	snowflake: Snowflake,
	_options?: Partial<Options>,
): UseLanyardReturn {
	const options: Options = {
		...DEFAULT_OPTIONS,
		..._options,
	};

	const [, rerender] = useState({});
	const context = useLanyardContext();

	if (!context.stateMap.has(snowflake)) {
		context.stateMap.set(snowflake, {
			state: 'initial',
			isLoading: false,
			data: options.initialData,
			error: undefined,
		});
	}

	const dispatch = (data: ContextData) => {
		context.stateMap.set(snowflake, data);

		for (const listener of context.listeners) {
			listener();
		}
	};

	const getState = () => {
		const data = context.stateMap.get(snowflake);

		if (!data) {
			throw new Error('State not found');
		}

		return data;
	};

	const loading = (isLoading: boolean) => {
		dispatch({
			...getState(),
			isLoading,
		});
	};

	const url = getURL(snowflake, options);

	const revalidate = useCallback(
		async (controller?: AbortController) => {
			if (getState().isLoading) {
				return;
			}

			loading(true);

			const result = await get(
				url,
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
		},
		[url],
	);

	useEffect(() => {
		const listener = () => rerender({});
		context.listeners.add(listener);

		const controller = new AbortController();

		void revalidate().finally(() => {
			loading(false);
		});

		return () => {
			controller.abort();
			context.listeners.delete(listener);
		};
	}, [revalidate]);

	return {
		...getState(),

		// We want to make sure users cannot pass any arguments into this function
		// for example, when doing <button onClick={revalidate} />
		revalidate: useCallback(() => revalidate(), [revalidate]),
	};
}

export default useLanyard;
