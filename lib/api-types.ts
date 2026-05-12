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
