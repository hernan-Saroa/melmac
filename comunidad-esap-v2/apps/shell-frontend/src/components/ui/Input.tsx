import * as React from "react"
import { cn } from "../../lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
  }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="text-sm font-medium leading-none text-slate-700 peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-lg border bg-slate-50 px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:bg-white disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
            error ? "border-rose-500 focus-visible:ring-rose-500" : "border-slate-200",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-sm text-rose-500">{error}</p>}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
