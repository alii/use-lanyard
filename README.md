# `use-lanyard`

React hook for [lanyard](https://github.com/Phineas/lanyard), an easy way to track your Discord presence in real time.

### Features

- Easy to use
- Tiny: just the React binding over [`@prequist/lanyard`](https://github.com/prequist/lanyard)
- Real-time updates over WebSocket
- One deduplicated connection shared across your whole app
- TypeScript support

```tsx
import {useLanyard} from 'use-lanyard';

const DISCORD_ID = '268798547439255572';

export function Lanyard() {
	const presence = useLanyard(DISCORD_ID);

	return <>{presence?.discord_status}</>;
}
```

The hook returns `undefined` until the first presence arrives, then updates live as your Discord status changes.

### Server-side rendering / initial data

You can provide initial data to the hook, which is used until the socket delivers live data on the client.

```tsx
const presence = useLanyard(DISCORD_ID, {
	initialData: myInitialDataFromTheServer,
});
```

When subscribing to multiple users, initial data is keyed per snowflake. The types track exactly which snowflakes you provided: those keys are guaranteed to be present in the returned map (live data only ever overwrites them, never removes them), while the rest stay optional. Provide a presence for every subscribed snowflake and the whole map is complete — no undefined checks needed.

```tsx
const presences = useLanyard(
	['268798547439255572', '94490510688792576'],
	{
		initialData: {
			'268798547439255572': aliPresenceFromTheServer,
			'94490510688792576': phinPresenceFromTheServer,
		},
	},
);
```

To fetch that initial data on the server — or for any one-off request — use the async `get` util (re-exported from [`@prequist/lanyard`](https://github.com/prequist/lanyard)). It fetches a presence once over REST and throws a `LanyardHTTPError` on failure, e.g. for a user Lanyard does not monitor.

```ts
import {get} from 'use-lanyard';

const presence = await get('268798547439255572');
```

### It just works, everywhere

Call `useLanyard` anywhere in your app, as many times as you like. Every hook pointed at the same API host shares a single WebSocket connection for the whole tab - there is no context provider to set up and no risk of duplicate connections or racing requests.

Subscriptions are reference counted per snowflake: mounting another hook for an id that is already subscribed reuses the existing subscription, new ids are added to the shared connection incrementally, and the connection closes when the last hook unmounts. Hooks only re-render when a presence they are subscribed to actually changes.

### Subscribing to multiple users

Pass an array of snowflakes to subscribe to multiple users at once. In this case the hook returns a map of snowflake to presence. Snowflakes that Lanyard does not monitor are omitted from the map, so each entry is possibly undefined.

```tsx
import {useLanyard} from 'use-lanyard';

export function Lanyards() {
	const presences = useLanyard([
		'268798547439255572',
		'94490510688792576',
	]);

	return (
		<>{presences?.['268798547439255572']?.discord_status}</>
	);
}
```

### Advanced usage

If you need access to the underlying response types in TypeScript, you can import them as follows.

```ts
import type {Types} from 'use-lanyard';

type User = Types.DiscordUser;
```

You can also customize the API endpoint that is used, if you wanted to self-host Lanyard.

```tsx
export function Lanyard() {
	const presence = useLanyard(DISCORD_ID, {
		api: {
			hostname: 'my-lanyard.app',

			// Tell the hook to use wss/https or ws/http
			secure: true,
		},
	});

	return <>...</>;
}
```

### Migrating from v1

- `useLanyard` now subscribes over the WebSocket and returns the presence directly (`Types.Presence | undefined`) — no per-mount HTTP request, and the `{data, state, error, isLoading, revalidate}` wrapper is gone. For REST (one-off fetches, SSR initial data, or checking whether a user is monitored), use the exported async `get` util.
- `useLanyardWS` has been removed; `useLanyard` is the same hook. Renaming the call is the only change needed.
- The connection/caching layer now lives in `@prequist/lanyard` 2.0 as `LanyardClient` — use-lanyard is just the React binding, and re-exports everything from `@prequist/lanyard` for convenience. Use the client directly if you need presence outside of React.
- `get` now returns the presence directly and throws `LanyardHTTPError` on failure (it previously returned a `{success, data | error}` result object). `LanyardError` and `getURL` are gone; `LanyardHTTPError` has the same `code` property, and URL building is `httpBase(api)` upstream.

## Acknowledgements

- [Alistair Smith](https://github.com/alii/) – Author of this library
- [Phineas Walton](https://github.com/Phineas/) – Author of lanyard
