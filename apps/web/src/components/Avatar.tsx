import { clsx } from "clsx";

// Generate a deterministic color from a string (user id or name)
function stringToColor(str: string): string {
  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-sky-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
    "bg-fuchsia-500",
    "bg-pink-500",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

interface AvatarProps {
  firstName?: string;
  lastName?: string;
  userId?: string;
  color?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-6 w-6 text-xs",
  md: "h-8 w-8 text-sm",
  lg: "h-10 w-10 text-base",
};

export function Avatar({
  firstName,
  lastName,
  userId,
  color,
  size = "md",
  className,
}: AvatarProps) {
  const initials =
    [firstName?.[0], lastName?.[0]].filter(Boolean).join("").toUpperCase() ||
    "?";
  const bgColor = color || stringToColor(userId || firstName || "?");

  return (
    <div
      className={clsx(
        "flex items-center justify-center rounded-full font-bold text-white flex-shrink-0",
        bgColor,
        sizeClasses[size],
        className,
      )}
      title={`${firstName || ""} ${lastName || ""}`.trim()}
    >
      {initials}
    </div>
  );
}

interface AvatarGroupProps {
  users: Array<{ id?: string; firstName?: string; lastName?: string }>;
  max?: number;
  size?: "sm" | "md" | "lg";
}

export function AvatarGroup({ users, max = 3, size = "sm" }: AvatarGroupProps) {
  const visible = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div className="flex -space-x-1">
      {visible.map((u, i) => (
        <Avatar
          key={u.id || i}
          firstName={u.firstName}
          lastName={u.lastName}
          userId={u.id}
          size={size}
          className="ring-2 ring-white"
        />
      ))}
      {remaining > 0 && (
        <div
          className={clsx(
            "flex items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600 ring-2 ring-white",
            sizeClasses[size],
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
