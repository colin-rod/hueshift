import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const sectionHeaderVariants = cva(
  "flex flex-col space-y-1",
  {
    variants: {
      size: {
        sm: "space-y-0.5",
        md: "space-y-1",
        lg: "space-y-2",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

const sectionTitleVariants = cva(
  "font-bold tracking-tight",
  {
    variants: {
      size: {
        sm: "text-lg",
        md: "text-xl md:text-2xl",
        lg: "text-2xl md:text-3xl",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

export interface SectionHeaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sectionHeaderVariants> {
  title: string
  description?: string
}

const SectionHeader = React.forwardRef<HTMLDivElement, SectionHeaderProps>(
  ({ className, title, description, size, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(sectionHeaderVariants({ size }), className)}
        {...props}
      >
        <h2 className={cn(sectionTitleVariants({ size }))}>{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    )
  }
)
SectionHeader.displayName = "SectionHeader"

export { SectionHeader }
