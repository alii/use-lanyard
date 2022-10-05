import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from 'react';
import type {API, Data, LanyardResponse, Snowflake} from './types';

export type ContextData =
	| {
			state: 'initial';
			isLoading: boolean;
			data: Data | undefined;
			error: undefined;
	  }
	| {
			state: 'loaded';
			isLoading: boolean;
			data: Data;
			error: LanyardError | undefined;
	  }
	| {
			state: 'errored';
			isLoading: boolean;
			data: Data | undefined;
			error: LanyardError | undefined;
	  };

export type Context = {
	listeners: Set<() => void>;
	stateMap: Map<Snowflake, ContextData>;
};

export type UseLanyardREST = ContextData & {
	revalidate(): Promise<void>;
};

export const context = createContext<Context>({
	listeners: new Set(),
	stateMap: new Map(),
});

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

export function useLanyardContext() {
	return useContext(context);
}

export type Options = {
	/**
	 * The Base URL of Lanyard's API. Defaults to `https://api.lanyard.rest`
	 */
	base: string;

	/**
	 * Initial data to use. Useful if server side rendering.
	 */
	initialData?: Data;
};

export function useLanyard(
	snowflake: Snowflake,
	_options?: Partial<Options>,
): UseLanyardREST {
	const options: Options = {
		base: 'https://api.lanyard.rest',
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

	const revalidate = useCallback(async (controller?: AbortController) => {
		if (getState().isLoading) {
			return;
		}

		loading(true);

		const init: RequestInit = {
			method: 'GET',
			signal: controller?.signal ?? null,
			headers: {Accept: 'application/json'},
		};

		const request = new Request(`${options.base}/v1/users/${snowflake}`, init);
		const response = await fetch(request);

		const body = (await response.json()) as LanyardResponse;

		if ('error' in body) {
			dispatch({
				...getState(),
				state: 'errored',
				error: new LanyardError(request, response, body),
				isLoading: false,
			});
		} else {
			dispatch({
				...getState(),
				state: 'loaded',
				data: body.data,
				isLoading: false,
			});
		}
	}, []);

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
