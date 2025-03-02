"use client";

import { useState, useEffect } from "react";
import { useModelStore, Variable } from "@/store/model-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { FormulaInputField } from "@/components/formula-input-field";

interface VariableRowProps {
  variable: Variable;
  calculations: number[];
}

export function VariableRowFixed({ variable, calculations }: VariableRowProps) {
  const { updateVariable, deleteVariable } = useModelStore();
  const [name, setName] = useState(variable.name);
  const [formula, setFormula] = useState(variable.formula || []);

  // Debounce updates to prevent excessive recalculations
  useEffect(() => {
    const timer = setTimeout(() => {
      if (name !== variable.name || formula !== variable.formula) {
        updateVariable(variable.id, {
          ...variable,
          name,
          formula,
        });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [name, formula, variable, updateVariable]);

  return (
    <>
      {/* Fixed Variable and Formula columns */}
      <div className="col-span-2 border-b last:border-b-0">
        <div className="grid grid-cols-[200px_300px]">
          <div className="p-4">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Variable name"
              className="max-w-[180px] py-5"
            />
          </div>
          <div className="p-4">
            <FormulaInputField value={formula} onChange={setFormula} />
          </div>
        </div>
      </div>

      {/* Scrollable calculations section */}
      <div className="overflow-x-auto border-b last:border-b-0">
        <div className="flex min-w-max">
          {calculations?.map((value, index) => (
            <div key={index} className="p-4 text-left font-mono min-w-[120px]">
              <div className="font-sans font-semibold">
                {" "}
                {new Date(2025, index).toLocaleString("default", {
                  month: "short",
                })}
              </div>

              {formatNumber(value)}
            </div>
          )) ||
            Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="p-4  font-mono text-muted-foreground min-w-[120px]"
              >
                <div className="font-sans font-semibold">
                  {" "}
                  {new Date(2025, i).toLocaleString("default", {
                    month: "short",
                  })}
                </div>
                -
              </div>
            ))}
        </div>
      </div>

      {/* Fixed action button column */}
      <div className="p-4 border-b last:border-b-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => deleteVariable(variable.id)}
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </>
  );
}
