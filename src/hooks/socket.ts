import type {Types} from '@prequist/lanyard';
import {useEffect, useState} from 'react';
import {DEFAULT_OPTIONS, type Options} from '../types';

export enum SocketOpcode {
	Event = 0,
	Hello = 1,
	Initialize = 2,
	Heartbeat = 3,
}

export enum SocketEvents {
	INIT_STATE = 'INIT_STATE',
	PRESENCE_UPDATE = 'PRESENCE_UPDATE',
}

export interface SocketData extends Types.Presence {
	heartbeat_interval?: number;
}

export interface SocketMessage {
	op: SocketOpcode;
	t?: SocketEvents;
	d?: SocketData;
}

/**
 * To avoid setting a timeout with no interval, we should
 * just fallback to a safe/sensible default (10s)
 */
const SAFE_DEFAULT_HEARTBEAT = 10_000;

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
	snowflake: Types.Snowflake,
	userOptions?: Partial<Options>,
): Types.Presence | undefined {
	const options = {
		...DEFAULT_OPTIONS,
		...userOptions,
	};

	const [data, setData] = useState<Types.Presence>();

	const protocol = options.api.secure ? 'wss' : 'ws';
	const url = `${protocol}://${options.api.hostname}/socket`;

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
					}, message.d?.heartbeat_interval ?? SAFE_DEFAULT_HEARTBEAT);

					if (socket.readyState === socket.OPEN) {
						socket.send(
							JSON.stringify({
								op: SocketOpcode.Initialize,
								d: {subscribe_to_id: snowflake},
							}),
						);
					}

					break;
				}

				case SocketOpcode.Event: {
					switch (message.t) {
						case SocketEvents.INIT_STATE:
						case SocketEvents.PRESENCE_UPDATE: {
							if (message.d) {
								setData(message.d);
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
		};
	}, [url]);

	return data ?? options.initialData;
}
