import { clsx } from "clsx";

type BadgeVariant =
  | "gray"
  | "blue"
  | "green"
  | "red"
  | "yellow"
  | "purple"
  | "orange"
  | "teal";

const variantClasses: Record<BadgeVariant, string> = {
  gray: "bg-gray-100 text-gray-700",
  blue: "bg-blue-100 text-blue-700",
  green: "bg-green-100 text-green-700",
  red: "bg-red-100 text-red-700",
  yellow: "bg-yellow-100 text-yellow-700",
  purple: "bg-purple-100 text-purple-700",
  orange: "bg-orange-100 text-orange-700",
  teal: "bg-teal-100 text-teal-700",
};

// Map common status strings to badge variants
export function statusToVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    AVAILABLE: "green",
    ACTIVE: "green",
    COMPLETED: "green",
    APPROVED: "green",
    SIGNED: "purple",
    IN_PROGRESS: "blue",
    IN_USE: "blue",
    PENDING: "yellow",
    MAINTENANCE: "yellow",
    DRAFT: "gray",
    ARCHIVED: "gray",
    RETIRED: "gray",
    CANCELLED: "gray",
    OUT_OF_ORDER: "red",
    REJECTED: "red",
    LOW_STOCK: "red",
    TODO: "gray",
    DONE: "green",
    PUBLIC: "teal",
    PRIVATE: "gray",
    INVITE_ONLY: "yellow",
  };
  return map[status] || "gray";
}

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  status?: string;
  className?: string;
}

export function Badge({ label, variant, status, className }: BadgeProps) {
  const resolvedVariant = variant || (status ? statusToVariant(status) : "gray");
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[resolvedVariant],
        className
      )}
    >
      {label}
    </span>
  );
}
