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

export type Snowflake = `${bigint}`;

export type LanyardResponse =
	| API.SuccessfulAPIResponse<Data>
	| API.ErroredAPIResponse;

export interface Data {
	spotify: Spotify | null;
	kv: Record<string, string>;
	listening_to_spotify: boolean;
	discord_user: DiscordUser;
	discord_status: string;
	activities: Activity[];
	active_on_discord_web: boolean;
	active_on_discord_mobile: boolean;
	active_on_discord_desktop: boolean;
}

export interface Spotify {
	track_id: string;
	timestamps: Timestamps;
	song: string;
	artist: string;
	album_art_url: string;
	album: string;
}

export interface Timestamps {
	start: number;
	end: number;
}

export interface DiscordUser {
	username: string;
	public_flags: number;
	id: Snowflake;
	discriminator: string;
	avatar: string;
}

export interface Activity {
	type: number;
	state: string;
	name: string;
	id: Snowflake;
	emoji?: Emoji;
	created_at: number;
	timestamps?: Timestamps;
	sync_id?: string;
	session_id?: string;
	party?: Party;
	flags?: number;
	details?: string;
	assets?: Assets;
	application_id?: string;
}

export interface Emoji {
	name: string;
	id: Snowflake;
	animated: boolean;
}

export interface Party {
	id: string;
}

export interface Assets {
	small_text: string;
	small_image: string;
	large_text: string;
	large_image: string;
}
