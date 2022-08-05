import React from 'react';
import {render} from 'react-dom';
import {useLanyardWs} from '../src/index';

function App() {
	const presence = useLanyardWs('268798547439255572');

	return (
		<pre>
			<code>{JSON.stringify(presence, null, 2)}</code>
		</pre>
	);
}

render(<App />, document.getElementById('root'));
