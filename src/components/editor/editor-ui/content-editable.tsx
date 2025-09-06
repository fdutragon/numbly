import { JSX } from "react"
import { ContentEditable as LexicalContentEditable } from "@lexical/react/LexicalContentEditable"

type Props = {
  placeholder: string
  className?: string
  placeholderClassName?: string
}

export function ContentEditable({
  placeholder,
  className,
  placeholderClassName,
}: Props): JSX.Element {
  return (
    <LexicalContentEditable
      className={
        className ??
        `ContentEditable__root relative block min-h-96 min-h-full overflow-auto px-12 py-8 focus:outline-none 
         text-foreground/90 leading-relaxed tracking-wide 
         selection:bg-primary/20 selection:text-primary-foreground 
         focus:ring-2 focus:ring-primary/10 focus:ring-offset-2 focus:ring-offset-background 
         transition-all duration-200 ease-in-out 
         font-medium text-base 
         caret-primary 
         [&>*]:transition-all [&>*]:duration-150`
      }
      aria-placeholder={placeholder}
      placeholder={
        <div
          className={
            placeholderClassName ??
            `pointer-events-none absolute top-0 left-0 overflow-hidden 
             px-8 py-4 text-ellipsis select-none 
             font-medium text-base tracking-wide leading-relaxed
             bg-gradient-to-r from-purple-400/60 via-pink-400/60 to-blue-400/60
             bg-clip-text text-transparent animate-pulse
             [animation-duration:3s]`
          }
        >
          {placeholder}
        </div>
      }
    />
  )
}
