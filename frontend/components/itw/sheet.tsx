"use client"

import { Drawer as DrawerPrimitive } from "vaul"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Bottom sheet (vaul) no visual do evento — arrastável pra fechar, ideal pro celular.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  kicker,
  description,
  children,
  className,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  kicker?: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <DrawerPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/75 backdrop-blur-[2px]" />
        <DrawerPrimitive.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[88dvh] w-full max-w-md flex-col border-t border-line-strong bg-surface outline-none",
            className,
          )}
        >
          <div className="h-[3px] w-full bg-crimson" />
          <div className="mx-auto mt-3 h-1 w-10 bg-line-strong" />
          <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-4">
            <div className="min-w-0">
              {kicker && (
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan">
                  <span className="opacity-60">// </span>
                  {kicker}
                </p>
              )}
              <DrawerPrimitive.Title className="mt-1 font-display text-lg font-black uppercase tracking-tight text-white">
                {title}
              </DrawerPrimitive.Title>
              {description ? (
                <DrawerPrimitive.Description className="mt-1 text-sm text-muted-foreground">{description}</DrawerPrimitive.Description>
              ) : (
                <DrawerPrimitive.Description className="sr-only">{title}</DrawerPrimitive.Description>
              )}
            </div>
            <DrawerPrimitive.Close
              className="flex h-10 w-10 shrink-0 items-center justify-center border border-line-strong text-muted-foreground active:scale-95"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </DrawerPrimitive.Close>
          </div>
          <div className="overflow-y-auto px-5 pb-[max(20px,env(safe-area-inset-bottom))]">{children}</div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  )
}
