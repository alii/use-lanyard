import {createContext, useContext} from 'react';
import {LanyardError} from '../hooks';
import {Data, Snowflake} from '../types';

export type ContextData =
	| {
			state: 'initial';
			isLoading: boolean;
			error: undefined;

			// Data could exist at this initial stage
			// because of.initialData in options
			data: Data | undefined;
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

export function useLanyardContext() {
	return useContext(context);
}

export type Context = {
	listeners: Set<() => void>;
	stateMap: Map<Snowflake, ContextData>;
};

export const context = createContext<Context>({
	listeners: new Set(),
	stateMap: new Map(),
});
