"use client"

import type React from "react"

import { useRef, useState, useEffect, type KeyboardEvent, useCallback } from "react"
import { useFormulaStore } from "@/store/formula-store"
import { useQuery } from "@tanstack/react-query"
import { Tag } from "@/components/tag"
import { Suggestions } from "@/components/suggestions"
import { calculateFormula } from "@/lib/formula-calculator"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FormulaInputProps {
  onClose?: () => void
}

export default function FormulaInput({ onClose }: FormulaInputProps) {
  const { formula, addTag, addOperand, addNumber, removeLastItem, setFormula, setActiveTagIndex, activeTagIndex } =
    useFormulaStore()

  const [inputValue, setInputValue] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [result, setResult] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch suggestions based on input value
  const { data: suggestions = [] } = useQuery({
    queryKey: ["suggestions", inputValue],
    queryFn: async () => {
      if (!inputValue.trim()) return []

      const response = await fetch(`/api/suggestions?query=${encodeURIComponent(inputValue)}`)
      if (!response.ok) {
        throw new Error("Failed to fetch suggestions")
      }
      return response.json()
    },
    enabled: inputValue.trim().length > 0,
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)

    if (value.trim()) {
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Handle operands with proper spacing
    if (["+", "-", "*", "/", "(", ")", "^"].includes(e.key)) {
      e.preventDefault()

      // Don't add operator if it's the first item (except parentheses)
      if (formula.length === 0 && !["(", ")"].includes(e.key)) {
        return
      }

      // Don't add operator if the last item was an operator (except parentheses)
      const lastItem = formula[formula.length - 1]
      if (lastItem?.type === "operand" && !["(", ")"].includes(e.key)) {
        return
      }

      addOperand(e.key)
      setInputValue("")
      setShowSuggestions(false)
      calculateResult()
      return
    }

    // Handle numbers (allow negative numbers)
    if (/^[0-9]$/.test(e.key) && !inputValue) {
      e.preventDefault()
      const lastItem = formula[formula.length - 1]

      // Allow number after operator or at start
      if (!lastItem || lastItem.type === "operand") {
        addNumber(e.key)
        calculateResult()
      }
      return
    }

    // Handle backspace
    if (e.key === "Backspace" && !inputValue) {
      e.preventDefault()
      removeLastItem()
      calculateResult()
      return
    }

    // Handle enter to select first suggestion
    if (e.key === "Enter" && showSuggestions && suggestions.length > 0) {
      e.preventDefault()
      handleSelectSuggestion(suggestions[0])
      return
    }

    // Handle escape to close formula input
    if (e.key === "Escape" && onClose) {
      e.preventDefault()
      onClose()
      return
    }
  }

  const handleSelectSuggestion = (suggestion: any) => {
    addTag({
      id: suggestion.id,
      name: suggestion.name,
      value: suggestion.value || 0,
      timePeriod: "This month",
    })
    setInputValue("")
    setShowSuggestions(false)
    calculateResult()
    inputRef.current?.focus()
  }

  const calculateResult = useCallback(() => {
    try {
      const result = calculateFormula(formula)
      setResult(result)
    } catch (error) {
      setResult(null)
    }
  }, [formula])

  useEffect(() => {
    calculateResult()
  }, [calculateResult])

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium">Formula</h3>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div
        className="flex items-center flex-wrap gap-1 p-3 border rounded-md bg-white min-h-[50px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
        onClick={() => inputRef.current?.focus()}
      >
        {formula.map((item, index) => {
          if (item.type === "tag") {
            return (
              <Tag
                key={`${item.id}-${index}`}
                tag={item}
                isActive={activeTagIndex === index}
                onClick={() => setActiveTagIndex(index)}
              />
            )
          } else if (item.type === "operand") {
            return (
              <span key={index} className="text-gray-700 mx-1">
                {item.value}
              </span>
            )
          } else if (item.type === "number") {
            return (
              <span key={index} className="text-blue-600 mx-1">
                {item.value}
              </span>
            )
          }
          return null
        })}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="flex-grow outline-none min-w-[50px]"
          placeholder={formula.length === 0 ? "Enter a formula..." : ""}
          autoFocus
        />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <Suggestions suggestions={suggestions} onSelect={handleSelectSuggestion} />
      )}

      {result !== null && (
        <div className="mt-4 p-3 border rounded-md bg-gray-50">
          <p className="text-sm text-gray-500">Result:</p>
          <p className="text-xl font-semibold">{result}</p>
        </div>
      )}
    </div>
  )
}

