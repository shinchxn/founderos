import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ className, label, error, id, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-[#8B93A9]">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          "h-9 w-full rounded-lg border border-[#1F2330] bg-[#191C23] px-3 text-sm text-[#F0F2FA] placeholder:text-[#4A5168]",
          "focus:outline-none focus:ring-1 focus:ring-[#6C63FF] focus:border-[#6C63FF]",
          "transition-colors duration-150 disabled:opacity-50",
          error && "border-[#EF4444] focus:ring-[#EF4444]",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-[#EF4444]">{error}</p>}
    </div>
  );
}
