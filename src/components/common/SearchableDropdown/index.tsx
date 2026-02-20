"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export type SearchableDropdownOption = {
  label: string
  value: string
}

type SearchableDropdownProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  options: SearchableDropdownOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyLabel?: string
  disabled?: boolean
  className?: string
}

export default function SearchableDropdown({
  id,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  emptyLabel = "No results found.",
  disabled,
  className,
}: SearchableDropdownProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const listboxId = id ? `${id}-listbox` : undefined
  const inputId = id ? `${id}-search` : undefined

  const selectedOption = options.find((option) => option.value === value)

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return options

    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(normalizedQuery) ||
        option.value.toLowerCase().includes(normalizedQuery)
    )
  }, [options, query])

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", onPointerDown)

    return () => {
      document.removeEventListener("mousedown", onPointerDown)
    }
  }, [open])

  const handleSelect = (nextValue: string) => {
    onChange(nextValue)
    setQuery("")
    setOpen(false)
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Button
        id={id}
        type="button"
        variant="outline"
        className="w-full justify-between font-normal"
        onClick={() => setOpen((previous) => !previous)}
        disabled={disabled}
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-haspopup="listbox"
        aria-label={id ? undefined : placeholder}
      >
        <span className={cn(!selectedOption && "text-muted-foreground")}>
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronsUpDown className="text-muted-foreground size-4" />
      </Button>

      {open && (
        <div className="bg-popover text-popover-foreground absolute z-50 mt-2 w-full rounded-md border p-2 shadow-md">
          <Input
            id={inputId}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="mb-2 h-8"
            autoFocus
            aria-label={searchPlaceholder}
          />

          <div id={listboxId} className="max-h-56 overflow-y-auto" role="listbox">
            {filteredOptions.length === 0 ? (
              <p className="text-muted-foreground px-2 py-2 text-sm">{emptyLabel}</p>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className="hover:bg-accent flex w-full items-center justify-between rounded-sm px-2 py-2 text-left text-sm"
                  role="option"
                  aria-selected={option.value === value}
                >
                  <span>{option.label}</span>
                  {option.value === value && <Check className="size-4" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
