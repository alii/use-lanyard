import {useEffect, useState} from 'react';
import {Data, Snowflake} from './types';

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

export interface SocketData extends Data {
	heartbeat_interval?: number;
}

export interface SocketMessage {
	op: SocketOpcode;
	t?: SocketEvents;
	d?: SocketData;
}

export function useLanyardWS(snowflake: Snowflake | Snowflake[]) {
	const [presence, setPresence] = useState<Data>();

	useEffect(() => {
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

			socket = new WebSocket('wss://api.lanyard.rest/socket');

			socket.addEventListener('open', () => {
				console.log('Lanyard: Socket connection opened');
			});

			socket.addEventListener('close', connect);

			socket.addEventListener('message', event => {
				const data: SocketMessage = JSON.parse(event.data);

				switch (data.op) {
					case SocketOpcode.Hello:
						heartbeat = setInterval(() => {
							if (socket.readyState === socket.OPEN) {
								socket.send(JSON.stringify({op: SocketOpcode.Heartbeat}));
							}
						}, data.d?.heartbeat_interval);

						if (socket.readyState === socket.OPEN) {
							socket.send(
								JSON.stringify({
									op: SocketOpcode.Initialize,
									d: subscribe_data,
								}),
							);
						}

						break;

					case SocketOpcode.Event:
						switch (data.t) {
							case SocketEvents.INIT_STATE:
							case SocketEvents.PRESENCE_UPDATE:
								if (data.d) {
									setPresence(data.d);
								}

								break;

							default:
								break;
						}

						break;
					default:
						break;
				}
			});
		}

		connect();

		return () => {
			clearInterval(heartbeat);

			socket.removeEventListener('close', connect);
			socket.close();
		};
	}, []);

	return presence;
}
