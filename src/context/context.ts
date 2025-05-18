import type {Types} from '@prequist/lanyard';
import {createContext, useContext} from 'react';
import type {Options} from '../types';
import type {LanyardError} from '../utils/get';

export type State =
	| {
			state: 'initial';
			isLoading: boolean;
			error: undefined;

			/**
			 * Data could exist *even* in the `initial` state
			 * if {@link Options.initialData} is passed during SSR
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

export class StateMap {
	private readonly map = new Map<Types.Snowflake, State>();

	get(
		snowflake: Types.Snowflake,
		initialData: Types.Presence | undefined,
	): State {
		const state = this.map.get(snowflake);

		if (!state) {
			const init: State = {
				state: 'initial',
				isLoading: false,
				data: initialData,
				error: undefined,
			};

			this.map.set(snowflake, init);

			return init;
		}

		return state;
	}

	set(snowflake: Types.Snowflake, state: State) {
		this.map.set(snowflake, state);
	}

	delete(snowflake: Types.Snowflake) {
		this.map.delete(snowflake);
	}
}

const context = createContext({
	listeners: new Set<() => void>(),
	stateMap: new StateMap(),
});

export function useLanyardContext() {
	return useContext(context);
}
