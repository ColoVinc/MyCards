import { cn } from '#/lib/utils'

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded border-0 border-b-2 border-transparent bg-muted px-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus-visible:border-b-primary focus-visible:outline-none disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full rounded border-0 border-b-2 border-transparent bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus-visible:border-b-primary focus-visible:outline-none disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'h-10 w-full cursor-pointer rounded border-0 border-b-2 border-transparent bg-muted px-3 text-sm text-foreground focus-visible:border-b-primary focus-visible:outline-none disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('label-caps mb-2 block text-muted-foreground', className)}
      {...props}
    />
  )
}

export function FieldError({ message }: { message: string | undefined }) {
  if (!message) return null
  return (
    <p className="mt-1.5 text-xs font-medium text-destructive">{message}</p>
  )
}
