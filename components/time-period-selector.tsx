"use client";

import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TimePeriodSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const TIME_PERIODS = [
  "This Month",
  "Previous Month",
  "1 Year Ago",
  "Last 3 Months",
  "Last 12 Months",
  "Calendar YTD",
  "Cumulative",
  "All Months",
  "Custom",
] as const;

export type TimePeriod = (typeof TIME_PERIODS)[number];

export function TimePeriodSelector({
  value,
  onChange,
}: TimePeriodSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs gap-1 border-none rounded-none font-normal"
          onClick={(e) => {
            // Prevent the click from bubbling up to parent elements
            e.stopPropagation();
          }}
        >
          {value}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        {TIME_PERIODS.map((period) => (
          <DropdownMenuItem
            key={period}
            onSelect={() => onChange(period)}
            className={period === value ? "bg-muted" : ""}
          >
            {period}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
