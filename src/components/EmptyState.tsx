import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <span className="mb-5 grid size-20 place-items-center rounded-full bg-tint">
        <Icon size={36} className="text-brand" />
      </span>
      <h2 className="text-xl font-bold text-ink">{title}</h2>
      <p className="mt-2 max-w-xs text-soft">{description}</p>
      {action && (
        <Link
          href={action.href}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-brand px-6 py-3 font-bold text-white shadow-sm"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
