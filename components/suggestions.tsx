"use client"

interface SuggestionsProps {
  suggestions: Array<{
    id: string
    name: string
    value?: number
  }>
  onSelect: (suggestion: any) => void
}

export function Suggestions({ suggestions, onSelect }: SuggestionsProps) {
  return (
    <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
      <ul className="py-1">
        {suggestions.map((suggestion) => (
          <li
            key={suggestion.id}
            onClick={() => onSelect(suggestion)}
            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
          >
            <div className="font-medium">{suggestion.name}</div>
            {suggestion.value !== undefined && <div className="text-sm text-gray-500">Value: {suggestion.value}</div>}
          </li>
        ))}
      </ul>
    </div>
  )
}

