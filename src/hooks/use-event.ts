import {
	useInsertionEffect as React_useInsertionEffect,
	useCallback,
	useRef,
} from 'react';

const useInsertionEffect =
	typeof window !== 'undefined' ? React_useInsertionEffect : () => {};

export function useEvent<Fn extends Function>(fn: Fn): Fn {
	const ref = useRef(fn);

	useInsertionEffect(() => {
		ref.current = fn;
	}, [fn]);

	return useCallback<Fn>(
		function (this: unknown) {
			return ref.current.apply(this, arguments);
		} as never as Fn,
		[],
	);
}
