"use client";

import type React from "react";

import { useState } from "react";
import { useModelStore } from "@/store/model-store";
import { Button } from "@/components/ui/button";
import { Plus, Download, Upload } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { exportToCSV, importFile, importFromJSON } from "@/lib/data-utils";
import { VariableRowFixed } from "./variable-row";

export default function FinancialModel() {
  const {
    variables,
    addVariable,
    calculations,
    errors,
    setVariables,
    clearErrors,
  } = useModelStore();

  const [showImportError, setShowImportError] = useState(false);
  const [importErrorMessage, setImportErrorMessage] = useState("");

  const handleExport = () => {
    const data = {
      variables,
      calculations,
    };
    exportToCSV(data);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Use the new combined import function
      const data = await importFile(file);
      setVariables((data as { variables: typeof variables }).variables);
      setShowImportError(false);
      clearErrors();
    } catch (error) {
      setShowImportError(true);
      setImportErrorMessage(
        error instanceof Error ? error.message : "Failed to import file"
      );
    }

    // Reset file input so the same file can be selected again
    e.target.value = "";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button onClick={() => addVariable()} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Variable
        </Button>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>

          <div className="relative">
            <input
              type="file"
              accept=".json,.csv"
              onChange={handleImport}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button variant="outline" className="gap-2">
              <Upload className="h-4 w-4" />
              Import
            </Button>
          </div>
        </div>
      </div>
      {showImportError && (
        <Alert variant="destructive">
          {importErrorMessage ||
            "Failed to import file. Please ensure it's a valid JSON or CSV file."}
        </Alert>
      )}
      {showImportError && (
        <Alert variant="destructive">
          Failed to import file. Please ensure it's a valid JSON file.
        </Alert>
      )}

      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((error, index) => (
            <Alert key={index} variant="destructive">
              {error}
            </Alert>
          ))}
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-[200px_300px_1fr_48px]">
          {/* Fixed headers */}
          <div className="col-span-2 bg-muted/50">
            <div className="grid grid-cols-[200px_300px]">
              <div className="border-b p-4 text-left font-medium text-muted-foreground">
                Variable
              </div>
              <div className="border-b p-4 text-left font-medium text-muted-foreground">
                Formula
              </div>
            </div>
          </div>

          {/* Scrollable month headers */}
          <div className="overflow-x-auto bg-muted/50 border-b">
            <div className="flex min-w-max">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="p-4 text-right font-medium text-muted-foreground min-w-[120px]"
                ></div>
              ))}
            </div>
          </div>

          {/* Empty header for action buttons */}
          <div className="bg-muted/50 border-b"></div>

          {/* Fixed columns and scrollable calculations */}
          {variables.length > 0 ? (
            variables.map((variable) => (
              <VariableRowFixed
                key={variable.id}
                variable={variable}
                calculations={calculations[variable.id]}
              />
            ))
          ) : (
            <div className="col-span-4 text-center p-4 text-muted-foreground">
              No variables added. Click &quot;Add Variable&quot; to start
              building your model.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Modified VariableRow component that splits into fixed and scrollable parts
// function VariableRowFixed({ variable, calculations }) {
//   const { updateVariable, deleteVariable } = useModelStore();
//   const [name, setName] = useState(variable.name);
//   const [formula, setFormula] = useState(variable.formula || []);

//   // Debounce updates to prevent excessive recalculations
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       if (name !== variable.name || formula !== variable.formula) {
//         updateVariable(variable.id, {
//           ...variable,
//           name,
//           formula,
//         });
//       }
//     }, 500);
//     return () => clearTimeout(timer);
//   }, [name, formula, variable, updateVariable]);

//   return (
//     <>
//       {/* Fixed Variable and Formula columns */}
//       <div className="col-span-2 border-b last:border-b-0">
//         <div className="grid grid-cols-[200px_300px]">
//           <div className="p-4">
//             <Input
//               value={name}
//               onChange={(e) => setName(e.target.value)}
//               placeholder="Variable name"
//               className="max-w-[180px]"
//             />
//           </div>
//           <div className="p-4">
//             <FormulaInputField value={formula} onChange={setFormula} />
//           </div>
//         </div>
//       </div>

//       {/* Scrollable calculations section */}
//       <div className="overflow-x-auto border-b last:border-b-0">
//         <div className="flex min-w-max">
//           {calculations?.map((value, index) => (
//             <div key={index} className="p-4 text-right font-mono min-w-[120px]">
//               {formatNumber(value)}
//             </div>
//           )) ||
//             Array.from({ length: 12 }).map((_, i) => (
//               <div
//                 key={i}
//                 className="p-4 text-right font-mono text-muted-foreground min-w-[120px]"
//               >
//                 -
//               </div>
//             ))}
//         </div>
//       </div>

//       {/* Fixed action button column */}
//       <div className="p-4 border-b last:border-b-0">
//         <Button
//           variant="ghost"
//           size="icon"
//           onClick={() => deleteVariable(variable.id)}
//           className="h-8 w-8 text-muted-foreground hover:text-destructive"
//         >
//           <Trash2 className="h-4 w-4" />
//         </Button>
//       </div>
//     </>
//   );
// }
