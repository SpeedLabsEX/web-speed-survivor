/**
 * Shapes returned by api-speed-survivor.
 * Mirrors the response models in:
 *   api-speed-survivor/api/v1/wallet/router.py
 *   api-speed-survivor/api/v1/me/router.py
 *   api-speed-survivor/api/v1/authentication/models.py
 */

export interface LoginResponse {
	success: boolean;
	message: string;
	firebase_uid: string;
	email: string | null;
	token: string;
	claims?: Record<string, unknown> | null;
}

export interface MeAccount {
	account_uuid: string;
	firebase_uid: string | null;
	email: string | null;
	status: string | null;
	created_at: string | null;
}

export interface MeProfile {
	profile_uuid: string | null;
	display_name: string | null;
	avatar_uuid: string | null;
	bio: string | null;
	display_name_set_at: string | null;
	can_update_display_name: boolean;
}

export interface MeAvatar {
	avatar_uuid: string | null;
	avatar_image_url: string | null;
	emoji: string | null;
	is_default: boolean;
}

export interface MeResponse {
	account: MeAccount;
	profile: MeProfile | null;
	avatar: MeAvatar | null;
	settings: Record<string, unknown>;
	info: Record<string, unknown>;
}

export interface WalletBalance {
	balance: number | string;
	currency?: string;
	[key: string]: unknown;
}

export interface WalletTransaction {
	type: "deposit" | "withdrawal" | string;
	amount: number | string;
	description?: string | null;
	created_at: string;
	[key: string]: unknown;
}

export interface WalletTransactionList {
	transactions: WalletTransaction[];
	limit?: number;
	offset?: number;
	total?: number;
}

/**
 * Public profile shapes — mirrors
 * api-speed-survivor/modules/public_profiles/dtos/public_profile.py
 * (GET /api/v1/public/profiles/{username}).
 */
export interface PublicProfileSocialLinks {
	x_handle: string | null;
	discord: string | null;
	telegram: string | null;
	website_url: string | null;
}

export interface PublicProfileStats {
	games_played: number;
	pnl: number;
	pnl_percent: number;
	accuracy: number;
	win_rate: number;
	average_finish_rank: number | null;
	best_finish: number | null;
	biggest_hit: number | null;
	top_three_finishes: number;
	current_win_streak: number;
	longest_win_streak: number;
}

export interface PublicRecentActivityItem {
	contest_uuid: string;
	contest_name: string;
	contest_date: string | null;
	final_placement: number;
	prize_amount: number;
	entry_fee: number;
}

export interface PublicProfileResponse {
	account_uuid: string;
	username: string | null;
	bio: string | null;
	avatar_uuid: string | null;
	avatar_image_url: string | null;
	emoji: string | null;
	social_links: PublicProfileSocialLinks;
	stats: PublicProfileStats;
	recent_activity: PublicRecentActivityItem[];
}
