import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-unab-gray-300 bg-background px-3 py-2 text-sm text-unab-navy dark:text-white placeholder:text-unab-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-unab-red/20 focus-visible:border-unab-red disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
