import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from 'react';
import {
	API,
	Data,
	DEFAULT_OPTIONS,
	LanyardResponse,
	Options,
	Snowflake,
} from '../types';

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

export type UseLanyardReturn = ContextData & {
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

	const protocol = options.api.secure ? 'https' : 'http';
	const url = `${protocol}://${options.api.hostname}/v1/users/${snowflake}`;

	const revalidate = useCallback(
		async (controller?: AbortController) => {
			if (getState().isLoading) {
				return;
			}

			loading(true);

			const init: RequestInit = {
				method: 'GET',
				signal: controller?.signal ?? null,
				headers: {Accept: 'application/json'},
			};

			const request = new Request(url, init);
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
