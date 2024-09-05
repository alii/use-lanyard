export namespace API {
	export type SuccessfulAPIResponse<T> = {
		success: true;
		data: T;
	};

	export type ErroredAPIResponse = {
		success: false;
		error: {message: string; code: string};
	};
}

export type Options = {
	/**
	 * The Base URL of Lanyard's API. Defaults to `https://api.lanyard.rest`
	 */
	api: {
		hostname: string;
		secure?: boolean;
	};

	/**
	 * Initial data to use. Useful if server side rendering.
	 */
	initialData?: Data;
};

export const DEFAULT_OPTIONS: Options = {
	api: {
		hostname: 'api.lanyard.rest',
		secure: true,
	},
};

export type Snowflake = `${bigint}`;

export type LanyardResponse =
	| API.SuccessfulAPIResponse<Data>
	| API.ErroredAPIResponse;

export interface Data {
	spotify: Spotify | null;
	kv: Record<string, string>;
	listening_to_spotify: boolean;
	discord_user: DiscordUser;
	discord_status: 'online' | 'idle' | 'dnd' | 'offline';
	activities: Activity[];
	active_on_discord_web: boolean;
	active_on_discord_mobile: boolean;
	active_on_discord_desktop: boolean;
}

export interface Spotify {
	track_id: string | null;
	timestamps: Timestamps;
	song: string;
	artist: string | null;
	album_art_url: string | null;
	album: string | null;
}

export interface Timestamps {
	start: number;
	end: number;
}

export interface DiscordUser {
	username: string;
	public_flags: number;
	id: Snowflake;
	global_name: string | null;
	/**
	 * @deprecated Use global_name instead.
	 */
	display_name: string | null;
	discriminator: string;
	bot: boolean;
	avatar_decoration_data: {
		asset: string;
		sku_id: bigint;
	} | null;
	avatar: string | null;
}

export interface Activity {
	type: number;
	state: string;
	name: string;
	id: string;
	emoji?: Emoji;
	created_at: number;
	timestamps?: Timestamps;
	sync_id?: string;
	session_id?: string;
	party?: Party;
	flags?: number;
	details?: string;
	assets?: Assets;
	application_id?: Snowflake;
}

export interface Emoji {
	name: string;
	id: Snowflake;
	animated: boolean;
}

export interface Party {
	size: [number, number];
	id: string;
}

export interface Assets {
	small_text: string;
	small_image: string;
	large_text: string;
	large_image: string;
}
