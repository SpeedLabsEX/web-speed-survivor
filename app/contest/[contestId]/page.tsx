import { redirect } from "next/navigation";

// Bare contest links (/contest/:id) resolve to the full details page. The
// mobile app shares /contest/:id/details, but this keeps shorter links working.
export default async function ContestIndexPage({
	params,
}: {
	params: Promise<{ contestId: string }>;
}) {
	const { contestId } = await params;
	redirect(`/contest/${encodeURIComponent(contestId)}/details`);
}
