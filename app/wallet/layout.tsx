"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { CompactHeader } from "@/components/CompactHeader";
import { ReferralAttacher } from "@/components/ReferralAttacher";
import { useAuth } from "@/lib/auth-context";
import { balanceCents, useBalance } from "@/lib/wallet-hooks";

export default function WalletLayout({ children }: { children: ReactNode }) {
	const router = useRouter();
	const { status } = useAuth();
	const { data: balance } = useBalance();

	useEffect(() => {
		if (status === "unauthenticated") {
			router.replace("/login?next=/wallet");
		}
	}, [status, router]);

	// Middleware already guarantees a session cookie on /wallet routes, so
	// render the shell immediately while /api/auth/me confirms in the
	// background — pages show skeletons, data queries run in parallel. Only an
	// explicit rejection sends the user to login.
	if (status === "unauthenticated") {
		return null;
	}

	return (
		<div className="min-h-screen">
			<ReferralAttacher />
			<CompactHeader balanceCents={balanceCents(balance)} />
			<div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
				{children}
			</div>
		</div>
	);
}
