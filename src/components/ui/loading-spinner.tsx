import { cn } from "@/lib/utils"

type LoadingSpinnerSize = "sm" | "md" | "lg"
type LoadingSpinnerVariant = "default" | "primary" | "muted" | "white"

interface LoadingSpinnerProps {
  /** Size of the spinner: sm (16px), md (32px), lg (48px) */
  size?: LoadingSpinnerSize
  /** Color variant of the spinner */
  variant?: LoadingSpinnerVariant
  /** Optional text to display below the spinner */
  text?: string
  /** Additional CSS classes */
  className?: string
  /** Whether to center the spinner in its container */
  centered?: boolean
  /** Whether to show in fullscreen mode */
  fullScreen?: boolean
}

const sizeClasses: Record<LoadingSpinnerSize, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-4"
}

const variantClasses: Record<LoadingSpinnerVariant, string> = {
  default: "border-blue-600",
  primary: "border-primary",
  muted: "border-muted-foreground",
  white: "border-white"
}

export function LoadingSpinner({
  size = "md",
  variant = "primary",
  text,
  className,
  centered = false,
  fullScreen = false
}: LoadingSpinnerProps) {
  const spinnerElement = (
    <div
      className={cn(
        "animate-spin rounded-full border-b-transparent",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      role="status"
      aria-label={text || "Loading"}
    >
      <span className="sr-only">{text || "Loading"}</span>
    </div>
  )

  // Simple spinner without text
  if (!text && !centered && !fullScreen) {
    return spinnerElement
  }

  const contentWithText = (
    <div className="text-center">
      <div className="flex justify-center mb-4">
        {spinnerElement}
      </div>
      {text && (
        <p className={cn(
          "text-sm",
          variant === "muted" ? "text-muted-foreground" : "text-gray-600"
        )}>
          {text}
        </p>
      )}
    </div>
  )

  // Full screen loading overlay
  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        {contentWithText}
      </div>
    )
  }

  // Centered in parent container
  if (centered) {
    return (
      <div className="flex items-center justify-center py-8">
        {contentWithText}
      </div>
    )
  }

  return contentWithText
}

/** Full page loading state with spinner */
export function PageLoading({ text = "Loading..." }: { text?: string }) {
  return <LoadingSpinner size="lg" variant="primary" text={text} fullScreen />
}

/** Inline loading state with spinner */
export function InlineLoading({ text }: { text?: string }) {
  return (
    <div className="flex items-center">
      <LoadingSpinner size="sm" variant="primary" className="mr-2" />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  )
}

/** Section loading state with spinner */
export function SectionLoading({ text }: { text?: string }) {
  return <LoadingSpinner size="md" variant="primary" text={text} centered />
}
