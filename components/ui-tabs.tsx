'use client'

import React, { createContext, useCallback, useContext, useId, useMemo, useState } from 'react'

type TabsProps = React.HTMLAttributes<HTMLElement> & { size?: string }
type TabsContextValue = { value: string; setValue: (value: string) => void; id: string }
const TabsContext = createContext<TabsContextValue | null>(null)

function Root({ defaultValue = '', value: controlledValue, onValueChange, children, ...props }: TabsProps & {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
}) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue)
  const id = useId()
  const value = controlledValue ?? uncontrolledValue
  const setValue = useCallback((next: string) => {
    if (controlledValue === undefined) setUncontrolledValue(next)
    onValueChange?.(next)
  }, [controlledValue, onValueChange])
  const context = useMemo(() => ({ value, setValue, id }), [value, setValue, id])
  return <TabsContext.Provider value={context}><div {...props} className={`cryo-tabs-root ${props.className ?? ''}`.trim()}>{children}</div></TabsContext.Provider>
}

function List(props: TabsProps) {
  const { size, ...domProps } = props
  void size
  return <div {...domProps} className={`cryo-tabs-list ${props.className ?? ''}`.trim()} role="tablist" />
}

function Trigger({ value, children, ...props }: TabsProps & { value: string }) {
  const context = useContext(TabsContext)
  const selected = context?.value === value
  return (
    <button
      {...props}
      type="button"
      id={context ? `${context.id}-tab-${value}` : undefined}
      aria-controls={selected && context ? `${context.id}-panel-${value}` : undefined}
      className={`cryo-tabs-trigger ${props.className ?? ''}`.trim()}
      role="tab"
      aria-selected={selected}
      data-state={selected ? 'active' : 'inactive'}
      tabIndex={selected ? 0 : -1}
      onClick={(event: React.MouseEvent<HTMLElement>) => {
        props.onClick?.(event)
        context?.setValue(value)
      }}
      onKeyDown={(event: React.KeyboardEvent<HTMLButtonElement>) => {
        props.onKeyDown?.(event)
        if (event.defaultPrevented) return
        const tabs = Array.from(event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? [])
        const currentIndex = tabs.indexOf(event.currentTarget)
        if (currentIndex < 0) return
        const nextIndex = event.key === 'ArrowRight'
          ? (currentIndex + 1) % tabs.length
          : event.key === 'ArrowLeft'
            ? (currentIndex - 1 + tabs.length) % tabs.length
            : event.key === 'Home'
              ? 0
              : event.key === 'End'
                ? tabs.length - 1
                : currentIndex
        if (nextIndex === currentIndex) return
        event.preventDefault()
        tabs[nextIndex]?.focus()
        tabs[nextIndex]?.click()
      }}
    >
      {children}
    </button>
  )
}

function Content({ value, children, ...props }: TabsProps & { value: string }) {
  const context = useContext(TabsContext)
  if (context?.value !== value) return null
  return (
    <div
      {...props}
      id={context ? `${context.id}-panel-${value}` : undefined}
      aria-labelledby={context ? `${context.id}-tab-${value}` : undefined}
      className={`cryo-tabs-content ${props.className ?? ''}`.trim()}
      role="tabpanel"
      tabIndex={0}
    >
      {children}
    </div>
  )
}

export const Tabs = { Root, List, Trigger, Content }
