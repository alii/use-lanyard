import useSWR, {SWRConfiguration} from 'swr';
import {Data, LanyardResponse} from './types';

export class LanyardError extends Error {
	constructor(public readonly code: number, message: string) {
		super(message);
	}
}

export type Options = Omit<SWRConfiguration<Data, LanyardError>, 'fetcher'>;

export function useLanyard(snowflake: string, options?: Options) {
	return useSWR<Data, LanyardError>(
		`lanyard:${snowflake}`,
		async () => {
			const request = await fetch(
				`https://api.lanyard.rest/v1/users/${snowflake}`,
			);

			const body = (await request.json()) as LanyardResponse;

			if ('error' in body) {
				throw new LanyardError(request.status, body.error.message);
			}

			return body.data;
		},
		options,
	);
}

export default useLanyard;
