import React from 'react';
import {useLanyard, Options} from './hook';
import {Data} from './types';
import {styled} from '@stitches/react';

interface Props {
	id: string;
	initialData?: Data;
	options?: Options;
}

export function LanyardDisplay(props: Props) {
	const {data: lanyard} = useLanyard(props.id, props.options);

	if (!lanyard) {
		return null;
	}

	if (lanyard.activities.length === 0) {
		return <div>{lanyard.discord_user.avatar}</div>;
	}

	return <Container>uo</Container>;
}

const Container = styled('div', {
	padding: 12,
	border: '1px solid gray',
	background: 'Aquamarine',
});
