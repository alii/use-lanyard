import type {Types} from '@prequist/lanyard';
import {useEffect, useState} from 'react';
import {DEFAULT_OPTIONS, type Options} from '../types';

export enum SocketOpcode {
	Event = 0,
	Hello = 1,
	Initialize = 2,
	Heartbeat = 3,
	Unsubscribe = 4,
}

export enum SocketEvents {
	INIT_STATE = 'INIT_STATE',
	PRESENCE_UPDATE = 'PRESENCE_UPDATE',
}

/**
 * A map of snowflake to presence. This is the shape of `INIT_STATE`'s
 * data (and of what `useLanyardWS` returns) when subscribing to
 * multiple snowflakes.
 *
 * Values are `Partial` in practice because Lanyard omits ids it does
 * not monitor from `INIT_STATE`.
 */
export type PresenceMap<S extends Types.Snowflake = Types.Snowflake> = Record<
	S,
	Types.Presence
>;

export interface SocketData extends Types.Presence {
	heartbeat_interval?: number;
}

export interface SocketMessage {
	op: SocketOpcode;
	t?: SocketEvents;
	d?: SocketData | Partial<PresenceMap>;
}

/**
 * To avoid setting a timeout with no interval, we should
 * just fallback to a safe/sensible default (10s)
 */
const SAFE_DEFAULT_HEARTBEAT = 10_000;

export function useLanyardWS<const S extends readonly Types.Snowflake[]>(
	snowflakes: S,
	options: Partial<Options<Partial<PresenceMap<S[number]>>>> & {
		initialData: PresenceMap<S[number]>;
	},
): PresenceMap<S[number]>;
export function useLanyardWS<const S extends readonly Types.Snowflake[]>(
	snowflakes: S,
	options: Partial<Options<Partial<PresenceMap<S[number]>>>> & {
		initialData: Partial<PresenceMap<S[number]>>;
	},
): Partial<PresenceMap<S[number]>>;
export function useLanyardWS<const S extends readonly Types.Snowflake[]>(
	snowflakes: S,
	options?: Partial<Options<Partial<PresenceMap<S[number]>>>>,
): Partial<PresenceMap<S[number]>> | undefined;
export function useLanyardWS(
	snowflake: Types.Snowflake,
	options: Partial<Options> & {
		initialData: NonNullable<Options['initialData']>;
	},
): Types.Presence;
export function useLanyardWS(
	snowflake: Types.Snowflake,
	options?: Partial<Options>,
): Types.Presence | undefined;
export function useLanyardWS(
	snowflake: Types.Snowflake | readonly Types.Snowflake[],
	userOptions?: Partial<Options<Types.Presence | Partial<PresenceMap>>>,
): Types.Presence | Partial<PresenceMap> | undefined {
	const options = {
		...DEFAULT_OPTIONS,
		...userOptions,
	};

	const initialData = options.initialData;
	const isMulti = Array.isArray(snowflake);

	const [data, setData] = useState<Types.Presence | Partial<PresenceMap>>();

	const protocol = options.api.secure ? 'wss' : 'ws';
	const url = `${protocol}://${options.api.hostname}/socket`;

	/**
	 * Stable identity for the subscription, so passing an inline
	 * array does not reconnect the socket every render.
	 */
	const subscriptionKey = isMulti ? snowflake.join(',') : snowflake;

	useEffect(() => {
		// Don't try to connect on server
		if (typeof window === 'undefined') {
			return;
		}

		if (!('WebSocket' in window)) {
			throw new Error(
				'Lanyard failed to connect: The WebSocket API is not supported in this browser.',
			);
		}

		let heartbeat: ReturnType<typeof setTimeout>;

		/**
		 * The current instance of the WebSocket.
		 *
		 * When the socket unexpectedly closes, this variable
		 * will be reassigned to a new socket instance.
		 */
		let socket: WebSocket;

		function connect() {
			if (heartbeat) {
				clearInterval(heartbeat);
			}

			socket = new WebSocket(url);

			socket.addEventListener('close', connect);
			socket.addEventListener('message', message);
		}

		function message(event: MessageEvent<string>) {
			const message = JSON.parse(event.data) as SocketMessage;

			switch (message.op) {
				case SocketOpcode.Hello: {
					heartbeat = setInterval(() => {
						if (socket.readyState === socket.OPEN) {
							socket.send(JSON.stringify({op: SocketOpcode.Heartbeat}));
						}
					}, (message.d as SocketData | undefined)?.heartbeat_interval ?? SAFE_DEFAULT_HEARTBEAT);

					if (socket.readyState === socket.OPEN) {
						socket.send(
							JSON.stringify({
								op: SocketOpcode.Initialize,
								d: isMulti
									? {subscribe_to_ids: snowflake}
									: {subscribe_to_id: snowflake},
							}),
						);
					}

					break;
				}

				case SocketOpcode.Event: {
					switch (message.t) {
						case SocketEvents.INIT_STATE: {
							if (message.d) {
								if (isMulti) {
									// `d` is a snowflake -> presence map. Merge over any
									// initial data so SSR presences for ids that Lanyard
									// omits (unmonitored) are preserved.
									const state = message.d as Partial<PresenceMap>;

									setData(previous => ({
										...(initialData as Partial<PresenceMap> | undefined),
										...(previous as Partial<PresenceMap> | undefined),
										...state,
									}));
								} else {
									setData(message.d as Types.Presence);
								}
							}

							break;
						}

						case SocketEvents.PRESENCE_UPDATE: {
							if (message.d) {
								if (isMulti) {
									// `d` is a single presence with no top-level id, so
									// key the update by `discord_user.id`.
									const presence = message.d as Types.Presence;

									setData(previous => ({
										...(initialData as Partial<PresenceMap> | undefined),
										...(previous as Partial<PresenceMap> | undefined),
										[presence.discord_user.id]: presence,
									}));
								} else {
									setData(message.d as Types.Presence);
								}
							}

							break;
						}

						default: {
							break;
						}
					}

					break;
				}

				default: {
					break;
				}
			}
		}

		connect();

		return () => {
			clearInterval(heartbeat);

			socket.removeEventListener('close', connect);
			socket.removeEventListener('message', message);

			socket.close();

			// The next effect run is a different subscription, so it
			// must not render this one's data while it initializes
			setData(undefined);
		};
		// `snowflake` is captured, but `subscriptionKey` covers its identity
	}, [url, subscriptionKey]);

	return data ?? options.initialData;
}
