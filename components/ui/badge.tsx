import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full text-xs font-medium px-2 py-0.5",
  {
    variants: {
      variant: {
        default: "bg-[#191C23] text-[#8B93A9] border border-[#1F2330]",
        brand: "bg-[rgba(108,99,255,0.1)] text-[#6C63FF]",
        success: "bg-[rgba(34,197,94,0.1)] text-[#22C55E]",
        warning: "bg-[rgba(245,158,11,0.1)] text-[#F59E0B]",
        danger: "bg-[rgba(239,68,68,0.1)] text-[#EF4444]",
        info: "bg-[rgba(56,189,248,0.1)] text-[#38BDF8]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}
