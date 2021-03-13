# `use-lanyard`

React hook for [lanyard](https://github.com/Phineas/lanyard/), an easy way to track your Discord presence through REST or websockets.

It's easy to use and fully typed. it exports an [swr](https://github.com/vercel/swr) `responseInterface`, but if you don't know what that means, here's an example:

```tsx
import { useLanyard } from 'use-lanyard';

const DISCORD_ID = '268798547439255572';

export function Activity() {
  const { data: activity } = useLanyard(DISCORD_ID);

  return <>...</>;
}
```

### Types

You can also import the named types as follows

```ts
import { Data, Activity } from 'use-lanyard';
```

## Acknowledgements

- [Phineas Walton](https://github.com/Phineas/) – Author of lanyward
- [Alistair Smith](https://github.com/alii/) – Author of this library
