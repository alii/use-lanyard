import {LanyardResponse, Options, Snowflake} from '../types';
import {LanyardError} from '../hooks/rest';

export interface GetOptions extends Options {
	controller?: AbortController;
}

export function getURL(snowflake: Snowflake, options: Options) {
	const protocol = options.api.secure ? ('https' as const) : ('http' as const);

	return `${protocol}://${options.api.hostname}/v1/users/${snowflake}` as const;
}

export async function get(url: ReturnType<typeof getURL>, options: GetOptions) {
	const init: RequestInit = {
		method: 'GET',
		signal: options.controller?.signal ?? null,
		headers: {Accept: 'application/json'},
	};

	const request = new Request(url, init);
	const response = await fetch(request);

	const body = (await response.json()) as LanyardResponse;

	if (!body.success) {
		return {
			success: false as const,
			error: new LanyardError(request, response, body),
		};
	}
	return {
		success: true as const,
		data: body.data,
	};
}
