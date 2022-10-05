import React from 'react';
import {createRoot} from 'react-dom/client';
import {useLanyard} from '../src/hook';

function App() {
	const state = useLanyard('268798547439255572');

	// Example showing built in request deduplication
	useLanyard('268798547439255572');
	useLanyard('268798547439255572');
	useLanyard('268798547439255572');
	useLanyard('268798547439255572');

	return (
		<pre>
			<code>{JSON.stringify(state, null, 2)}</code>

			<button onClick={state.revalidate}>revalidate</button>
		</pre>
	);
}

createRoot(document.getElementById('root')!).render(<App />);
