export type LanyardResponse = {
	success: boolean;
} & LanyardResponseErrorOrData;

export type LanyardResponseErrorOrData =
	| {data: Data}
	| {error: {message: string; code: string}};

export interface Data {
	spotify: Spotify | null;
	kv: {[key: string]: string};
	listening_to_spotify: boolean;
	discord_user: DiscordUser;
	discord_status: string;
	activities: Activity[];
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
	id: number;
	discriminator: string;
	avatar: string;
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
	application_id?: number;
}

export interface Emoji {
	name: string;
	id: number;
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
