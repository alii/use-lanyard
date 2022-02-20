import React from 'react';
import {render} from 'react-dom';
import {useLanyardWs} from '../src/index';

console.log(useLanyardWs);

function App() {
	const presence = useLanyardWs(process.env.USER_ID || '268798547439255572');

	return (
		<pre>
			<code>{JSON.stringify(presence, null, 2)}</code>
		</pre>
	);
}

render(<App />, document.getElementById('root'));
