import {createRoot} from 'react-dom/client';
import {useLanyard} from '../src/index';

function App() {
	const presence = useLanyard('268798547439255572');

	// Subscribing to multiple snowflakes returns
	// a map of snowflake -> presence
	const multi = useLanyard([
		'268798547439255572',
		'94490510688792576',
	]);

	// Connections are deduplicated across the whole tab: every hook
	// below shares the single WebSocket (and the subscriptions) of
	// the two hooks above, so you can call useLanyard anywhere in
	// your app without thinking about it
	useLanyard('268798547439255572');
	useLanyard('268798547439255572');
	useLanyard(['268798547439255572', '94490510688792576']);

	return (
		<pre>
			<code>
				{JSON.stringify({presence, multi}, null, 2)}
			</code>
		</pre>
	);
}

createRoot(document.getElementById('root')!).render(
	<App />,
);
