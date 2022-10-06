# `use-lanyard`

React hook for [lanyard](https://github.com/Phineas/lanyard), an easy way to track your Discord presence through REST or WebSocket.

### Features

- Easy to use
- Zero dependencies
- TypeScript support
- WebSocket support
- Deduplicates network requests

```tsx
import {useLanyard} from 'use-lanyard';

const DISCORD_ID = '268798547439255572';

export function Lanyard() {
	const {data} = useLanyard(DISCORD_ID);

	return <>...</>;
}
```

### Server-side rendering / initial data

You can also provide initial data to the hook, which will be used until the client is hydrated/able to fetch the latest data.

```tsx
const {data} = useLanyard(DISCORD_ID, {
	initialData: myInitialDataFromTheServer,
});

// Also works with the WebSocket hook
const data = useLanyardWS(DISCORD_ID, {
	initialData: myInitialDataFromTheServer,
});
```

### Socket

There is also a hook for using the WebSocket that Lanyard provides, here's an example:

```tsx
import {useLanyardWS} from 'use-lanyard';

const DISCORD_ID = '268798547439255572';

export function Lanyard() {
	const data = useLanyardWS(DISCORD_ID);

	return <>...</>;
}
```

### Advanced usage

If you need access to the underlying response types in TypeScript, you can import them as follows.

```ts
// See src/types.ts for all types
import type {Data, Activity, LanyardResponse} from 'use-lanyard';
```

You can also customize the API endpoint that is used, if you wanted to self-host Lanyard.

```ts
export function Lanyard() {
	const {data} = useLanyard(DISCORD_ID, {
		api: {
			hostname: 'my-lanyard.app',

			// Tell the hook to use https/wss or http/ws
			secure: true,
		},
	});

	return <>...</>;
}
```

## Acknowledgements

- [Phineas Walton](https://github.com/Phineas/) – Author of lanyard
- [Alistair Smith](https://github.com/alii/) – Author of this library
