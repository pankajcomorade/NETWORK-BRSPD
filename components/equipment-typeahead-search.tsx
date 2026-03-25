"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Search, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface EquipmentSearchResult {
  nodeName: string
  nodeType: string
  nodeStatus: string
  addressId: string | null
  addressLine: string
}

interface EquipmentTypeaheadProps {
  onSelect: (equipment: EquipmentSearchResult) => void
  isLoading?: boolean
}

export function EquipmentTypeaheadSearch({ onSelect, isLoading: externalLoading }: EquipmentTypeaheadProps) {
  const [searchInput, setSearchInput] = useState("")
  const [suggestions, setSuggestions] = useState<EquipmentSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationMessage, setValidationMessage] = useState<string | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastApiCallRef = useRef<number>(0)
  const MIN_CHARS = 4
  const DEBOUNCE_MS = 300
  const THROTTLE_MS = 500

  // Handle API call with throttling
  const fetchSuggestions = useCallback(async (query: string) => {
    const now = Date.now()
    
    // Throttle: prevent API calls within THROTTLE_MS of last call
    if (now - lastApiCallRef.current < THROTTLE_MS) {
      console.log("[v0] Throttled API call - too soon after last request")
      return
    }

    if (query.length < MIN_CHARS) {
      setValidationMessage(`Enter at least ${MIN_CHARS} characters to search`)
      setSuggestions([])
      return
    }

    setValidationMessage(null)
    setError(null)
    setIsLoading(true)
    lastApiCallRef.current = now

    try {
      console.log("[v0] Typeahead search - Fetching suggestions for:", query)
      const response = await fetch(
        `/api/equipment/typeahead-search?equipmentName=${encodeURIComponent(query)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Search failed: ${response.status}`)
      }

      const data = await response.json()
      console.log("[v0] Typeahead suggestions received:", data.results?.length || 0)

      if (!data.results || data.results.length === 0) {
        setValidationMessage("No equipment found matching your search")
        setSuggestions([])
      } else {
        setValidationMessage(null)
        setSuggestions(data.results)
        setShowDropdown(true)
        setHighlightedIndex(-1)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch suggestions"
      console.error("[v0] Typeahead search error:", errorMessage)
      setError(errorMessage)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Debounced search handler
  const handleInputChange = useCallback(
    (value: string) => {
      setSearchInput(value)
      setHighlightedIndex(-1)

      // Clear previous debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      if (value.length === 0) {
        setValidationMessage(null)
        setSuggestions([])
        setShowDropdown(false)
        setError(null)
        return
      }

      if (value.length < MIN_CHARS) {
        setValidationMessage(`Enter at least ${MIN_CHARS} characters to search (${value.length}/${MIN_CHARS})`)
        setSuggestions([])
        setShowDropdown(false)
        return
      }

      // Set debounce timer for API call
      debounceTimerRef.current = setTimeout(() => {
        fetchSuggestions(value)
      }, DEBOUNCE_MS)
    },
    [fetchSuggestions]
  )

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) {
      if (e.key === "Enter" && searchInput.length >= MIN_CHARS) {
        e.preventDefault()
      }
      return
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0))
        break
      case "ArrowUp":
        e.preventDefault()
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1))
        break
      case "Enter":
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[highlightedIndex])
        }
        break
      case "Escape":
        e.preventDefault()
        setShowDropdown(false)
        setHighlightedIndex(-1)
        break
    }
  }

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: EquipmentSearchResult) => {
    console.log("[v0] Equipment selected:", suggestion.nodeName)
    setSearchInput(suggestion.nodeName)
    setShowDropdown(false)
    setSuggestions([])
    setValidationMessage(null)
    setError(null)
    onSelect(suggestion)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const isInputValid = searchInput.length >= MIN_CHARS
  const showValidation = validationMessage && !isLoading
  const showError = error && !isLoading

  return (
    <div className="w-full space-y-2" ref={dropdownRef}>
      {/* Search Input */}
      <div className="relative flex items-center gap-2">
        <div className="flex-1 relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {isLoading ? (
              <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
            ) : (
              <Search className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <Input
            type="text"
            placeholder="Search equipment by name... (min 4 characters)"
            value={searchInput}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0 && searchInput.length >= MIN_CHARS) {
                setShowDropdown(true)
              }
            }}
            className={cn(
              "pl-9 h-10",
              isInputValid && !error && "border-green-500/30 focus:border-green-500",
              error && "border-destructive/30 focus:border-destructive"
            )}
            aria-label="Equipment name search"
            aria-autocomplete="list"
            aria-controls="typeahead-suggestions"
            aria-expanded={showDropdown && suggestions.length > 0}
            disabled={externalLoading}
          />
        </div>
      </div>

      {/* Validation Message */}
      {showValidation && (
        <div className={cn("flex items-center gap-2 p-2 rounded-md text-xs", showError ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-700 dark:text-amber-400")}>
          {showError ? (
            <AlertCircle className="h-3 w-3 shrink-0" />
          ) : (
            <AlertCircle className="h-3 w-3 shrink-0" />
          )}
          {validationMessage}
        </div>
      )}

      {/* Error Message */}
      {showError && (
        <div className="flex items-center gap-2 p-2 rounded-md bg-destructive/10 text-destructive text-xs">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </div>
      )}

      {/* Typeahead Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div
          id="typeahead-suggestions"
          className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.nodeName}-${index}`}
              onClick={() => handleSelectSuggestion(suggestion)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={cn(
                "w-full px-3 py-2 text-left text-sm border-b border-border/30 last:border-b-0 transition-colors",
                highlightedIndex === index
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-secondary/50 text-foreground"
              )}
              role="option"
              aria-selected={highlightedIndex === index}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium truncate">{suggestion.nodeName}</span>
                <Badge variant="outline" className="shrink-0 text-[10px]">
                  {suggestion.nodeType}
                </Badge>
              </div>
              {suggestion.addressLine && (
                <p className="text-xs text-muted-foreground mt-1 truncate">{suggestion.addressLine}</p>
              )}
            </button>
          ))}
        </div>
      )}

      {/* No Results State */}
      {showDropdown && suggestions.length === 0 && isInputValid && !isLoading && validationMessage && (
        <div className="p-3 rounded-lg bg-muted/50 border border-border/30 text-center text-xs text-muted-foreground">
          {validationMessage}
        </div>
      )}
    </div>
  )
}
