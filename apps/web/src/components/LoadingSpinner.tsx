import { clsx } from "clsx";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  fullPage?: boolean;
}

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-4",
};

export function LoadingSpinner({ size = "md", className, fullPage }: LoadingSpinnerProps) {
  const spinner = (
    <div
      className={clsx(
        "animate-spin rounded-full border-gray-200 border-t-blue-600",
        sizeClasses[size],
        className
      )}
    />
  );

  if (fullPage) {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
}
