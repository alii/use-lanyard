import useSWR from 'swr';
import { Data, LanyardResponse } from './types';

export * from './types';

export function useLanyard(snowflake: string) {
  return useSWR<Data>(`lanyard:${snowflake}`, async () => {
    const request = await fetch(
      `https://api.lanyard.rest/v1/users/${snowflake}`
    );

    const body = (await request.json()) as LanyardResponse;

    if ('error' in body) {
      throw new Error(body.error.message);
    }

    return body.data as Data;
  });
}

export default useLanyard;
