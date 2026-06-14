import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none",
  {
    variants: {
      variant: {
        default: "bg-[#6C63FF] text-white hover:bg-[#7B73FF]",
        secondary: "bg-[#191C23] text-[#F0F2FA] border border-[#1F2330] hover:bg-[#1E2230] hover:border-[#2D3348]",
        ghost: "text-[#8B93A9] hover:bg-[#191C23] hover:text-[#F0F2FA]",
        danger: "bg-[#EF4444] text-white hover:bg-[#DC2626]",
        outline: "border border-[#2D3348] text-[#F0F2FA] hover:bg-[#191C23]",
        link: "text-[#6C63FF] underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4",
        lg: "h-10 px-5",
        icon: "h-9 w-9 p-0",
        "icon-sm": "h-7 w-7 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
