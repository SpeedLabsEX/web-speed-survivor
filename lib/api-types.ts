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
	// Portion eligible for cash-out (excludes referral credit). Optional for
	// backward-compat with older API responses.
	withdrawable_balance?: number | string;
	// Remaining non-withdrawable referral credit.
	credit_balance?: number | string;
	currency?: string;
	[key: string]: unknown;
}

export interface ReferralSummary {
	code: string;
	share_link: string;
	referred_count: number;
	rewarded_count: number;
	credits_earned: number | string;
}

export interface AttachReferralResponse {
	success: boolean;
	status: string;
	message: string;
}

export interface WalletTransaction {
	type: "deposit" | "withdrawal" | string;
	amount: number | string;
	source?: string | null;
	reference_id?: string | null;
	description?: string | null;
	created_at: string;
	status?: string | null;
	provider?: string | null;
	provider_payout_amount_cents?: number | null;
	provider_fee_amount_cents?: number | null;
	metadata?: Record<string, unknown> | null;
	[key: string]: unknown;
}

export interface WalletTransactionList {
	transactions?: WalletTransaction[];
	data?: WalletTransaction[];
	pagination?: {
		total_count?: number;
		page?: number;
		limit?: number;
		has_more?: boolean;
	};
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

/**
 * A single shareable contest result ("win") — mirrors PublicWinResponse in
 * api-speed-survivor/modules/public_profiles/dtos/public_profile.py
 * (GET /api/v1/public/profiles/{username}/results/{contest_uuid}).
 */
export interface PublicWinResponse {
	username: string | null;
	avatar_image_url: string | null;
	contest_uuid: string;
	contest_name: string;
	contest_date: string | null;
	final_placement: number;
	total_players: number;
	prize_amount: number;
	entry_fee: number;
	pnl: number;
	is_winner: boolean;
}

/** A single prize tier on a contest payout ladder. */
export interface PublicContestPayoutTier {
	place: string;
	amount: string;
}

/**
 * A single contest's public/shareable info — mirrors ContestCardDTO in
 * api-speed-survivor/modules/contest_feed/dtos/contest_card.py
 * (GET /api/v1/public/contests/{header_uuid}). Registration state and the SSE
 * channel id are stripped server-side for anonymous viewers.
 */
export interface PublicContest {
	header_uuid: string;
	title: string;
	sponsor_name?: string | null;
	sponsor_logo?: string | null;
	grand_prize: number;
	total_prize_pool: number;
	max_prize_pool: number;
	payouts: PublicContestPayoutTier[];
	entry_fee: string;
	status: string;
	is_live: boolean;
	is_registration_open: boolean;
	image_url?: string | null;
	description?: string | null;
	payout_detail?: string | null;
	contest_date?: string | null;
	start_time?: string | null;
	sport: string;
	participant_count: number;
	pool_size_max: number;
	model_type: string;
}
