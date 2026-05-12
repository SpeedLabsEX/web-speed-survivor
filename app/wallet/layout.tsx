"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { CompactHeader } from "@/components/CompactHeader";
import { Spinner } from "@/components/ui/Spinner";
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

	if (status !== "authenticated") {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<Spinner size={28} />
			</div>
		);
	}

	return (
		<div className="min-h-screen">
			<CompactHeader balanceCents={balanceCents(balance)} />
			<div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
				{children}
			</div>
		</div>
	);
}
