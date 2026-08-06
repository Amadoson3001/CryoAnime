'use client'

import * as Select from '@radix-ui/react-select'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import type { ComponentProps } from 'react'

export type SelectOption = { value: string; label: string }

type CryoSelectProps = Omit<ComponentProps<typeof Select.Root>, 'children'> & {
  options: SelectOption[]
  placeholder?: string
  ariaLabel?: string
}

export default function CryoSelect({ options, placeholder, ariaLabel, ...rootProps }: CryoSelectProps) {
  return (
    <Select.Root {...rootProps}>
      <Select.Trigger className="cryo-select-trigger" aria-label={ariaLabel}>
        <Select.Value placeholder={placeholder} />
        <Select.Icon className="cryo-select-icon">
          <ChevronDown size={16} aria-hidden="true" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="cryo-select-content" position="popper" sideOffset={6}>
          <Select.ScrollUpButton className="cryo-select-scroll">
            <ChevronUp size={14} aria-hidden="true" />
          </Select.ScrollUpButton>
          <Select.Viewport className="cryo-select-viewport">
            {options.map(option => (
              <Select.Item key={option.value} value={option.value} className="cryo-select-item">
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator className="cryo-select-indicator">
                  <Check size={14} aria-hidden="true" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
          <Select.ScrollDownButton className="cryo-select-scroll">
            <ChevronDown size={14} aria-hidden="true" />
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}
