import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from 'react';
import type {API, Data, LanyardResponse, Snowflake} from './types';

export type ContextData =
	| {state: 'loaded'; isLoading: boolean; data: Data; error?: LanyardError}
	| {state: 'initial'; isLoading: boolean; data?: undefined; error?: undefined}
	| {state: 'errored'; isLoading: boolean; data?: Data; error: LanyardError};

export type UseLanyardREST = ContextData & {
	revalidate(): Promise<void>;
};

export const context = createContext<{
	listeners: Set<() => void>;
	data: ContextData;
}>({
	listeners: new Set(),
	data: {state: 'initial', isLoading: false},
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

export function useLanyard(
	snowflake: Snowflake,
	base = 'https://api.lanyard.rest',
): UseLanyardREST {
	const [, rerender] = useState({});
	const context = useLanyardContext();

	const dispatch = (data: ContextData) => {
		context.data = data;

		for (const listener of context.listeners) {
			listener();
		}
	};

	const loading = (isLoading: boolean) => {
		dispatch({
			...context.data,
			isLoading,
		});
	};

	const revalidate = useCallback(async (controller?: AbortController) => {
		if (context.data.isLoading) {
			return;
		}

		loading(true);

		const init: RequestInit = {
			method: 'GET',
			signal: controller?.signal,
			headers: {Accept: 'application/json'},
		};

		const request = new Request(`${base}/v1/users/${snowflake}`, init);
		const response = await fetch(request);

		const body = (await response.json()) as LanyardResponse;

		if ('error' in body) {
			dispatch({
				...context.data,
				state: 'errored',
				error: new LanyardError(request, response, body),
				isLoading: false,
			});
		} else {
			dispatch({
				...context.data,
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
		...context.data,

		// We want to make sure users cannot pass any arguments into this function
		// for example, when doing <button onClick={revalidate} />
		revalidate: useCallback(() => revalidate(), [revalidate]),
	};
}

export default useLanyard;
