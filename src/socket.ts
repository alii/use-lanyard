import {useEffect, useState} from 'react';
import {Data} from './types';

enum Op {
	Event,
	Hello,
	Initialize,
	Heartbeat,
}

enum Event {
	INIT_STATE = 'INIT_STATE',
	PRESENCE_UPDATE = 'PRESENCE_UPDATE',
}

interface SocketData extends Data {
	heartbeat_interval?: number;
}

interface SocketMessage {
	op: Op;
	t?: Event;
	d?: SocketData;
}

export function useLanyardWs(snowflake: string | string[]) {
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
					case Op.Hello:
						heartbeat = setInterval(() => {
							if (socket.readyState === socket.OPEN) {
								socket.send(JSON.stringify({op: Op.Heartbeat}));
							}
						}, data.d?.heartbeat_interval);

						if (socket.readyState === socket.OPEN) {
							socket.send(
								JSON.stringify({op: Op.Initialize, d: subscribe_data}),
							);
						}

						break;

					case Op.Event:
						switch (data.t) {
							case Event.INIT_STATE:
							case Event.PRESENCE_UPDATE:
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

export default useLanyardWs;
