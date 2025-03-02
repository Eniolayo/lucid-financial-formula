"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Tag } from "@/components/tag";
import { useQuery } from "@tanstack/react-query";

type Suggestion = {
  id: string;
  name: string;
  category: string;
  value: number;
};

type FormulaInputFieldProps = {
  value: Array<{
    type: "tag" | "operator";
    id?: string;
    name?: string;
    category?: string;
    value?: number;
    timePeriod?: string;
    operator?: string;
  }>;
  onChange: (value: any[]) => void;
};

const validOperators = ["+", "-", "*", "/", "^", "(", ")"];

export function FormulaInputField({ value, onChange }: FormulaInputFieldProps) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);
  const [suggestionsPosition, setSuggestionsPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const formulaItemsRef = useRef<(HTMLSpanElement | null)[]>([]);

  const suggestionQuery = inputValue
    .trim()
    .replace(
      new RegExp(
        `[${validOperators.map((op) => (op === "-" ? "\\-" : op)).join("")}]`,
        "g"
      ),
      ""
    );

  // Fetch suggestions based on input value
  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ["suggestions", suggestionQuery],
    queryFn: async () => {
      if (!suggestionQuery.trim()) return [];
      const response = await fetch(
        `/api/suggestions?query=${encodeURIComponent(suggestionQuery)}`
      );
      if (!response.ok) throw new Error("Failed to fetch suggestions");
      return response.json();
    },
    enabled: suggestionQuery.length > 0,
  });

  // Group suggestions by category
  const groupedSuggestions = suggestions.reduce(
    (acc: Record<string, Suggestion[]>, suggestion: Suggestion) => {
      if (!acc[suggestion.category]) {
        acc[suggestion.category] = [];
      }
      acc[suggestion.category].push(suggestion);
      return acc;
    },
    {}
  );

  // Update suggestions position when input changes
  useEffect(() => {
    if (inputRef.current && containerRef.current && showSuggestions) {
      const inputRect = containerRef.current.getBoundingClientRect();
      setSuggestionsPosition({
        top: inputRect.bottom + window.scrollY,
        left: inputRect.left + window.scrollX,
        width: inputRect.width,
      });
    }
  }, [showSuggestions, inputValue]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !containerRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle arrow key navigation for cursor positioning
  const handleArrowKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowLeft") {
      if (
        inputValue.length === 0 &&
        cursorPosition !== null &&
        cursorPosition > 0
      ) {
        e.preventDefault();
        setCursorPosition(cursorPosition - 1);
      } else if (
        inputValue.length === 0 &&
        cursorPosition === null &&
        value.length > 0
      ) {
        e.preventDefault();
        setCursorPosition(value.length - 1);
      }
    } else if (e.key === "ArrowRight") {
      if (cursorPosition !== null) {
        e.preventDefault();
        if (cursorPosition < value.length - 1) {
          setCursorPosition(cursorPosition + 1);
        } else {
          setCursorPosition(null);
          inputRef.current?.focus();
        }
      }
    }
  };

  // Main keyboard event handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle arrow keys for cursor navigation
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      handleArrowKeys(e);
      return;
    }

    // Handle Delete key for removing items at cursor position
    if (e.key === "Delete" && cursorPosition !== null) {
      e.preventDefault();
      const newValue = [...value];
      newValue.splice(cursorPosition, 1);
      onChange(newValue);
      if (cursorPosition >= newValue.length) {
        setCursorPosition(null);
        inputRef.current?.focus();
      }
      return;
    }

    // Handle inserting operators at cursor position
    if (validOperators.includes(e.key)) {
      e.preventDefault();

      if (cursorPosition !== null) {
        // Insert at cursor position
        const newValue = [...value];
        const prevItem = newValue[cursorPosition - 1];

        // Check if valid in this position according to BODMAS rules
        const isValidPosition =
          (e.key === "(" &&
            (cursorPosition === 0 || prevItem?.type === "operator")) ||
          (e.key === ")" && cursorPosition > 0 && prevItem?.type === "tag") ||
          (["*", "/", "+", "-", "^"].includes(e.key) &&
            prevItem?.type === "tag") ||
          prevItem?.operator === ")";

        if (isValidPosition) {
          newValue.splice(cursorPosition, 0, {
            type: "operator",
            operator: e.key,
          });
          onChange(newValue);
          setCursorPosition(cursorPosition + 1);
        }
      } else {
        // Add to the end
        const lastToken = value[value.length - 1];

        // Always allow opening bracket
        if (e.key === "(") {
          onChange([...value, { type: "operator", operator: e.key }]);
          setInputValue("");
          return;
        }

        // Allow closing bracket only if there's a matching opening bracket
        if (e.key === ")") {
          const openBrackets = value.filter(
            (v) => v.type === "operator" && v.operator === "("
          ).length;
          const closeBrackets = value.filter(
            (v) => v.type === "operator" && v.operator === ")"
          ).length;
          if (openBrackets > closeBrackets && lastToken?.type !== "operator") {
            onChange([...value, { type: "operator", operator: e.key }]);
            setInputValue("");
          }
          return;
        }

        // Allow operators after a tag or closing parenthesis
        if (
          lastToken?.type === "tag" ||
          (lastToken?.type === "operator" && lastToken.operator === ")")
        ) {
          onChange([...value, { type: "operator", operator: e.key }]);
          setInputValue("");
        }
      }
    } else if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      if (cursorPosition !== null) {
        // Insert number at cursor position
        const newValue = [...value];
        const prevItem =
          cursorPosition > 0 ? newValue[cursorPosition - 1] : null;

        if (!prevItem || prevItem.type === "operator") {
          newValue.splice(cursorPosition, 0, {
            type: "operator",
            operator: e.key,
          });
          onChange(newValue);
          setCursorPosition(cursorPosition + 1);
        }
      } else if (
        value.length === 0 ||
        value[value.length - 1].type === "operator"
      ) {
        onChange([...value, { type: "operator", operator: e.key }]);
        setInputValue("");
      }
    } else if (e.key === "Backspace") {
      if (inputValue.length === 0) {
        e.preventDefault();
        if (cursorPosition !== null && cursorPosition > 0) {
          // Remove item at cursor position - 1
          const newValue = [...value];
          newValue.splice(cursorPosition - 1, 1);
          onChange(newValue);
          setCursorPosition(
            cursorPosition - 1 === 0 ? null : cursorPosition - 1
          );
        } else if (cursorPosition === null && value.length > 0) {
          // Remove last item
          onChange(value.slice(0, -1));
        }
        setActiveTagIndex(null);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setCursorPosition(null);
    }
  };

  const handleSelectSuggestion = (suggestion: Suggestion) => {
    if (cursorPosition !== null) {
      // Insert tag at cursor position
      const newValue = [...value];
      newValue.splice(cursorPosition, 0, {
        type: "tag",
        id: suggestion.id,
        name: suggestion.name,
        category: suggestion.category,
        value: suggestion.value,
        timePeriod: "This Month",
      });
      onChange(newValue);
      setCursorPosition(cursorPosition + 1);
    } else {
      // Add to the end
      onChange([
        ...value,
        {
          type: "tag",
          id: suggestion.id,
          name: suggestion.name,
          category: suggestion.category,
          value: suggestion.value,
          timePeriod: "This Month",
        },
      ]);
    }
    setInputValue("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleUpdateTag = (index: number, updatedTag: any) => {
    const newValue = [...value];
    newValue[index] = { ...updatedTag, type: "tag" };
    onChange(newValue);
    setActiveTagIndex(null);
  };

  // Handle clicking on an item in the formula to position cursor
  const handleItemClick = (index: number) => {
    setCursorPosition(index);
    setActiveTagIndex(null);
    setInputValue("");
  };

  return (
    <div className="relative" ref={containerRef}>
      <div
        className="flex items-center overflow-hidden gap-x-2 gap-y-1 flex-wrap px-1.5 py-1 border rounded-md bg-white min-h-[42px] focus-within:ring-2 focus-within:ring-ring focus-within:border-input "
        onClick={() => {
          if (document.activeElement !== inputRef.current) {
            setCursorPosition(null);
            inputRef.current?.focus();
          }
        }}
      >
        {value.map((item, index) => {
          const isAtCursor = index === cursorPosition;

          if (item.type === "tag" && item.id && item.name) {
            return (
              <span
                key={`${item.id}-${index}`}
                ref={(el) => {
                  formulaItemsRef.current[index] = el;
                }}
                className={`relative whitespace-nowrap transform-none  ${
                  isAtCursor ? "ring-2 ring-blue-400" : ""
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleItemClick(index);
                }}
              >
                <Tag
                  tag={{
                    id: item.id,
                    name: item.name,
                    value: item.value,
                    timePeriod: item.timePeriod,
                  }}
                  isActive={activeTagIndex === index}
                  onClick={() => setActiveTagIndex(index)}
                  onUpdate={(updatedTag) => handleUpdateTag(index, updatedTag)}
                />
              </span>
            );
          } else if (item.type === "operator") {
            return (
              <span
                key={index}
                ref={(el) => {
                  formulaItemsRef.current[index] = el;
                }}
                className={`text-muted-foreground font-medium px-0.5 transform-none  cursor-pointer ${
                  isAtCursor
                    ? "bg-blue-100 ring-2 ring-blue-400"
                    : "hover:bg-gray-100"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleItemClick(index);
                }}
              >
                {item.operator}
              </span>
            );
          }
          return null;
        })}
        {cursorPosition === value.length && (
          <span className="h-5 w-0.5 bg-blue-500 animate-blink"></span>
        )}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(!!e.target.value);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setCursorPosition(null)}
          className="flex-1 min-w-[60px] text-sm outline-none bg-transparent"
          placeholder={value.length === 0 ? "Enter formula..." : ""}
        />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="fixed z-50 shadow-lg"
          style={{
            top: `${suggestionsPosition.top}px`,
            left: `${suggestionsPosition.left}px`,
            width: `${suggestionsPosition.width}px`,
          }}
        >
          <div className="bg-white rounded-md border max-h-64 overflow-y-auto">
            {Object.keys(groupedSuggestions).length > 0
              ? (
                  Object.entries(groupedSuggestions) as [string, Suggestion[]][]
                ).map(([category, items]) => (
                  <div key={category} className="border-b last:border-b-0">
                    <div className="px-3 py-1 bg-muted text-sm font-medium text-muted-foreground">
                      {category}
                    </div>
                    {items.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className="px-4 py-2 hover:bg-muted cursor-pointer flex justify-between items-center"
                        onClick={() => handleSelectSuggestion(suggestion)}
                      >
                        <div className="font-medium">{suggestion.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {suggestion.value}
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              : suggestions.map((suggestion: Suggestion) => (
                  <div
                    key={suggestion.id}
                    className="px-4 py-2 hover:bg-muted cursor-pointer flex justify-between items-center"
                    onClick={() => handleSelectSuggestion(suggestion)}
                  >
                    <div>
                      <div className="font-medium">{suggestion.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {suggestion.category}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {suggestion.value}
                    </div>
                  </div>
                ))}
          </div>
        </div>
      )}

      {/* Loading and No Suggestions states remain the same */}
      {showSuggestions && isLoading && (
        <div
          className="fixed z-50 shadow-lg"
          style={{
            top: `${suggestionsPosition.top}px`,
            left: `${suggestionsPosition.left}px`,
            width: `${suggestionsPosition.width}px`,
          }}
        >
          <div className="bg-white rounded-md border p-4 text-center">
            <span className="text-muted-foreground">
              Loading suggestions...
            </span>
          </div>
        </div>
      )}

      {showSuggestions && !isLoading && suggestions.length === 0 && (
        <div
          className="fixed z-50 shadow-lg"
          style={{
            top: `${suggestionsPosition.top}px`,
            left: `${suggestionsPosition.left}px`,
            width: `${suggestionsPosition.width}px`,
          }}
        >
          <div className="bg-white rounded-md border p-4 text-center">
            <span className="text-muted-foreground">No suggestions found</span>
          </div>
        </div>
      )}
    </div>
  );
}
