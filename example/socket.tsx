import React from 'react';
import {render} from 'react-dom';
import {useLanyardWS} from '../src/index';

function App() {
	const presence = useLanyardWS('268798547439255572');

	return (
		<pre>
			<code>{JSON.stringify(presence, null, 2)}</code>
		</pre>
	);
}

render(<App />, document.getElementById('root'));
