import type {Types} from '@prequist/lanyard';
import {useEffect, useState} from 'react';
import {DEFAULT_OPTIONS, type Options} from '../types';

export enum SocketOpcode {
	Event,
	Hello,
	Initialize,
	Heartbeat,
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

export function useLanyardWS(
	snowflake: Types.Snowflake | Types.Snowflake[],
	_options?: Partial<Options>,
) {
	const options = {
		...DEFAULT_OPTIONS,
		..._options,
	};

	const [data, setData] = useState<Types.Presence>();

	const protocol = options.api.secure ? 'wss' : 'ws';
	const url = `${protocol}://${options.api.hostname}/socket`;

	useEffect(() => {
		// Don't try to connect on server
		if (typeof window === 'undefined') {
			return;
		}

		if (!('WebSocket' in window || 'MozWebSocket' in window)) {
			throw new Error('WebSocket connections not supported in this browser.');
		}

		let subscribe_data: {subscribe_to_ids?: string[]; subscribe_to_id?: string};

		if (typeof snowflake === 'object') {
			subscribe_data = {subscribe_to_ids: snowflake};
		} else {
			subscribe_data = {subscribe_to_id: snowflake};
		}

		let heartbeat: ReturnType<typeof setTimeout>;
		let socket: WebSocket;

		function connect() {
			if (heartbeat) {
				clearInterval(heartbeat);
			}

			socket = new WebSocket(url);

			socket.addEventListener('open', () => {
				console.log('Lanyard: Socket connection opened');
			});

			socket.addEventListener('close', connect);

			socket.addEventListener('message', event => {
				const message = JSON.parse(event.data) as SocketMessage;

				switch (message.op) {
					case SocketOpcode.Hello: {
						heartbeat = setInterval(() => {
							if (socket.readyState === socket.OPEN) {
								socket.send(JSON.stringify({op: SocketOpcode.Heartbeat}));
							}
						}, message.d?.heartbeat_interval);

						if (socket.readyState === socket.OPEN) {
							socket.send(
								JSON.stringify({
									op: SocketOpcode.Initialize,
									d: subscribe_data,
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
			});
		}

		connect();

		return () => {
			clearInterval(heartbeat);

			socket.removeEventListener('close', connect);
			socket.close();
		};
	}, [url]);

	return data ?? options.initialData;
}
