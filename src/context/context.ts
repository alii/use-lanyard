import type {Types} from '@prequist/lanyard';
import {createContext, useContext} from 'react';
import {LanyardError} from '../hooks';

import type {Options} from '../types';

export type ContextData =
	| {
			state: 'initial';
			isLoading: boolean;
			error: undefined;

			/**
			 * Data could exist *even* in the `initial` state
			 * if {@link Options.initialData initialData} is passed during SSR
			 */
			data: Types.Presence | undefined;
	  }
	| {
			state: 'loaded';
			isLoading: boolean;
			data: Types.Presence;
			error: LanyardError | undefined;
	  }
	| {
			state: 'errored';
			isLoading: boolean;
			data: Types.Presence | undefined;
			error: LanyardError | undefined;
	  };

export function useLanyardContext() {
	return useContext(context);
}

export type Context = {
	listeners: Set<() => void>;
	stateMap: Map<Types.Snowflake, ContextData>;
};

export const context = createContext<Context>({
	listeners: new Set(),
	stateMap: new Map(),
});
