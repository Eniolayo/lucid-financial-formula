"use client";
import { TimePeriodSelector } from "@/components/time-period-selector";
import { cn } from "@/lib/utils";

type TagProps = {
  tag: {
    id: string;
    name: string;
    value?: number;
    timePeriod?: string;
  };
  isActive: boolean;
  onClick: () => void;
  onUpdate: (updatedTag: any) => void;
};

export function Tag({ tag, isActive, onClick, onUpdate }: TagProps) {
  const handleTimePeriodChange = (period: string) => {
    onUpdate({
      ...tag,
      type: "tag",
      timePeriod: period,
    });
  };

  return (
    <div className="flex items-center group border border-gray-300 rounded-full overflow-hidden">
      <div
        onClick={onClick}
        className={cn(
          "px-2 py-1 rounded-r-full text-sm font-medium cursor-pointer transition-colors",
          isActive
            ? "bg-blue-100 text-blue-800 border border-blue-300"
            : "bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200"
        )}
      >
        {tag.name}
        {/* <span className="text-xs "> - ({tag.value})</span> */}
      </div>
      <div className="opacity-50 group-hover:opacity-100 transition-opacity">
        <TimePeriodSelector
          value={tag.timePeriod || "This Month"}
          onChange={handleTimePeriodChange}
        />
      </div>
    </div>
  );
}
