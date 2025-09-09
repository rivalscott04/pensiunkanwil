import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const headingVariants = cva(
  "scroll-m-20 tracking-tight text-foreground",
  {
    variants: {
      level: {
        1: "text-4xl font-extrabold lg:text-5xl",
        2: "text-3xl font-bold lg:text-4xl",
        3: "text-2xl font-semibold lg:text-3xl",
        4: "text-xl font-semibold lg:text-2xl",
        5: "text-lg font-semibold",
        6: "text-base font-semibold",
      },
      color: {
        default: "text-foreground",
        primary: "text-primary",
        muted: "text-muted-foreground",
        destructive: "text-destructive",
        success: "text-success",
        white: "text-white",
      }
    },
    defaultVariants: {
      level: 1,
      color: "default",
    },
  }
)

const textVariants = cva(
  "leading-relaxed",
  {
    variants: {
      size: {
        xs: "text-xs",
        sm: "text-sm",
        base: "text-base",
        lg: "text-lg",
        xl: "text-xl",
      },
      color: {
        default: "text-foreground",
        primary: "text-primary",
        muted: "text-muted-foreground",
        destructive: "text-destructive",
        success: "text-success",
        white: "text-white",
      },
      weight: {
        normal: "font-normal",
        medium: "font-medium",
        semibold: "font-semibold",
        bold: "font-bold",
      }
    },
    defaultVariants: {
      size: "base",
      color: "default",
      weight: "normal",
    },
  }
)

export interface HeadingProps
  extends Omit<React.HTMLAttributes<HTMLHeadingElement>, 'color'>,
    VariantProps<typeof headingVariants> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
}

export interface TextProps
  extends Omit<React.HTMLAttributes<HTMLParagraphElement>, 'color'>,
    VariantProps<typeof textVariants> {
  as?: "p" | "span" | "div"
}

const AppHeading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, level, color, as, ...props }, ref) => {
    const Comp = as || `h${level || 1}`
    
    return (
      <Comp
        className={cn(headingVariants({ level, color, className }))}
        ref={ref as any}
        {...props}
      />
    )
  }
)
AppHeading.displayName = "AppHeading"

const AppText = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ className, size, color, weight, as = "p", ...props }, ref) => {
    const Comp = as
    
    return (
      <Comp
        className={cn(textVariants({ size, color, weight, className }))}
        ref={ref as any}
        {...props}
      />
    )
  }
)
AppText.displayName = "AppText"

export { AppHeading, AppText, headingVariants, textVariants }