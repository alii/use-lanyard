import useSWR, {SWRConfiguration} from 'swr';
import {Data, LanyardResponse} from './types';

export class LanyardError extends Error {
	public readonly code: number;

	constructor(
		public readonly request: Request,
		public readonly response: Response,
		message: string,
	) {
		super(message);
		this.code = this.response.status;
	}
}

export type Options = Omit<SWRConfiguration<Data, LanyardError>, 'fetcher'>;

export function useLanyard(snowflake: string, options?: Options) {
	return useSWR<Data, LanyardError>(
		`lanyard:${snowflake}`,
		async () => {
			const request = new Request(
				`https://api.lanyard.rest/v1/users/${snowflake}`,
			);

			const response = await fetch(request);

			const body = (await response.json()) as LanyardResponse;

			if ('error' in body) {
				throw new LanyardError(request, response, body.error.message);
			}

			return body.data;
		},
		options,
	);
}

export default useLanyard;
