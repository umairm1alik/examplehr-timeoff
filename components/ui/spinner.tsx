import { cn } from '@/lib/utils'

interface SpinnerProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Spinner({ className, size = 'md' }: SpinnerProps): JSX.Element {
  const sizeClass = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' }[size]
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        'animate-spin rounded-full border-2 border-current border-t-transparent',
        sizeClass,
        className,
      )}
    />
  )
}
