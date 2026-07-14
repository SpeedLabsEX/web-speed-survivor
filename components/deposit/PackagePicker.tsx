"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/cn";
import { env } from "@/lib/env";

export interface DepositPackage {
	id: string;
	label: string;
	cents: number;
}

const BASE_PACKAGES: DepositPackage[] = [
	{ id: "p_2000", label: "$20", cents: 20_00 },
	{ id: "p_5000", label: "$50", cents: 50_00 },
	{ id: "p_10000", label: "$100", cents: 100_00 },
	{ id: "p_20000", label: "$200", cents: 200_00 },
	{ id: "p_50000", label: "$500", cents: 500_00 },
];

export function depositPackages(): DepositPackage[] {
	const list = [...BASE_PACKAGES];
	if (env.features.enable1CentTest) {
		list.unshift({ id: "p_test_1c", label: "$0.01", cents: 1 });
	}
	return list;
}

interface PackagePickerProps {
	selectedId: string | null;
	onSelect: (pkg: DepositPackage | null) => void;
	customCents: number | null;
	onCustomChange: (cents: number | null) => void;
	disabled?: boolean;
}

export function PackagePicker({
	selectedId,
	onSelect,
	customCents,
	onCustomChange,
	disabled,
}: PackagePickerProps) {
	const packages = depositPackages();

	return (
		<div className="flex flex-col gap-6">
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
				{packages.map((pkg) => {
					const selected = selectedId === pkg.id;
					return (
						<button
							key={pkg.id}
							type="button"
							onClick={() => onSelect(pkg)}
							disabled={disabled}
							aria-pressed={selected}
							className={cn(
								"press-scale flex items-center",
								"rounded-[var(--radius-tile)] border p-5 text-left",
								"min-h-[88px] bg-[var(--color-panel)]",
								selected
									? "border-[var(--color-spine)] bg-[var(--color-spine-soft)]"
									: "border-[var(--color-hairline)] hover:border-[var(--color-hairline-2)]",
							)}
						>
							<span className="text-page-title text-[var(--color-text)] tabular">
								{pkg.label}
							</span>
						</button>
					);
				})}
			</div>

			<CustomAmountInput
				value={customCents}
				selected={selectedId === "custom"}
				onChange={(cents) => {
					onCustomChange(cents);
					onSelect(
						cents === null
							? null
							: { id: "custom", label: "Custom", cents },
					);
				}}
				disabled={disabled}
			/>
		</div>
	);
}

interface CustomAmountInputProps {
	value: number | null;
	selected: boolean;
	onChange: (cents: number | null) => void;
	disabled?: boolean;
}

function CustomAmountInput({
	value,
	selected,
	onChange,
	disabled,
}: CustomAmountInputProps) {
	const [rawValue, setRawValue] = useState(
		value === null ? "" : (value / 100).toFixed(2),
	);
	const [editing, setEditing] = useState(false);

	useEffect(() => {
		if (!editing) {
			setRawValue(value === null ? "" : (value / 100).toFixed(2));
		}
	}, [editing, value]);

	return (
		<label
			className={cn(
				"flex items-center gap-3 rounded-[var(--radius-input)] border px-4 h-12 transition-colors",
				selected
					? "border-[var(--color-spine)] bg-[var(--color-spine-soft)]"
					: "border-[var(--color-hairline)] bg-[var(--color-panel)] hover:border-[var(--color-hairline-2)]",
			)}
		>
			<span className="text-eyebrow text-[10px] tracking-[0.2em] text-[var(--color-text-muted)]">
				Custom
			</span>
			<span className="text-[var(--color-text-muted)]">$</span>
			<input
				type="text"
				inputMode="decimal"
				value={rawValue}
				disabled={disabled}
				placeholder="0.00"
				onChange={(e) => {
					const raw = e.target.value;
					if (!/^\d*(?:\.\d{0,2})?$/.test(raw)) return;

					setRawValue(raw);
					if (!raw) {
						onChange(null);
						return;
					}
					const parsed = Number.parseFloat(raw);
					const cents = Math.round(parsed * 100);
					onChange(Number.isSafeInteger(cents) && cents >= 1 ? cents : null);
				}}
				onFocus={() => setEditing(true)}
				onBlur={() => {
					setEditing(false);
					if (value !== null) {
						setRawValue((value / 100).toFixed(2));
					}
				}}
				className="flex-1 bg-transparent text-[15px] tabular text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-dim)]"
			/>
		</label>
	);
}
