import React from 'react';
import {render} from 'react-dom';
import {useLanyard} from '../src/index';

function App() {
	const {data: activity} = useLanyard(
		process.env.USER_ID || '268798547439255572',
	);

	return (
		<pre>
			<code>{JSON.stringify(activity, null, 2)}</code>
		</pre>
	);
}

render(<App />, document.getElementById('root'));
