export function exportToCSV(data: any) {
  // Convert the data to CSV format
  const variables = data.variables;
  const calculations = data.calculations;

  // Create headers
  const headers = [
    "Variable",
    "Formula",
    "Time Period",
    ...Array.from({ length: 12 }, (_, i) =>
      new Date(2025, i).toLocaleString("default", { month: "short" })
    ),
  ];

  // Define types for formula items
  interface TagItem {
    type: "tag";
    id: string;
    name: string;
    category?: string;
    value: number;
    timePeriod: string;
  }

  interface OperatorItem {
    type: "operator";
    operator: string;
  }

  type FormulaItem = TagItem | OperatorItem;

  interface Variable {
    name: string;
    id: string;
    formula: FormulaItem[];
  }

  // Create rows
  const rows = variables.map((variable: Variable) => {
    // Convert formula array to a readable string
    let formulaStr = "";
    let timePeriod = "N/A";

    // Find first tag item to get the time period
    const firstTagItem = variable.formula.find(
      (item) => item.type === "tag"
    ) as TagItem | undefined;
    if (firstTagItem) {
      timePeriod = firstTagItem.timePeriod;
    }

    // Build the formula string
    variable.formula.forEach((item) => {
      if (item.type === "tag") {
        // Add tag name and value
        formulaStr += `${item.name} (${item.value})`;
      } else if (item.type === "operator") {
        // Add operator with spacing
        formulaStr += ` ${item.operator} `;
      }
    });

    return [
      variable.name,
      formulaStr,
      timePeriod,
      ...calculations[variable.id].map((value: number) => value.toString()),
    ];
  });

  // Combine headers and rows
  const csvContent: string = [
    headers.join(","),
    ...rows.map((row: (string | number)[]) => row.join(",")),
  ].join("\n");

  // Create and trigger download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `financial_model_${new Date().toISOString().split("T")[0]}.csv`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Existing JSON import function
export async function importFromJSON(file: File) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        // Validate the imported data structure
        if (!Array.isArray(data.variables) || !data.calculations) {
          throw new Error("Invalid file format");
        }
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };
    reader.readAsText(file);
  });
}

// New CSV import function
export async function importFromCSV(file: File) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvText = event.target?.result as string;
        const lines = csvText.split("\n");

        // Parse headers
        const headers = lines[0].split(",");

        // Check if CSV format is valid
        if (
          !headers.includes("Variable") ||
          !headers.includes("Formula") ||
          !headers.includes("Time Period")
        ) {
          throw new Error("Invalid CSV format: missing required headers");
        }

        // Find column indices
        const varNameIndex = headers.indexOf("Variable");
        const formulaIndex = headers.indexOf("Formula");
        const timePeriodIndex = headers.indexOf("Time Period");

        // Get month indices (starting after the 3 required columns)
        const monthIndices = headers
          .slice(3)
          .map((_, idx) => idx + 3)
          .filter((idx) => idx < headers.length);

        // Parse variables
        const variables: any[] = [];
        const calculations: Record<string, number[]> = {};

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue; // Skip empty lines

          const columns = parseCSVRow(lines[i]);
          if (columns.length < 3) continue;

          const varName = columns[varNameIndex];
          const formulaStr = columns[formulaIndex];
          const timePeriod = columns[timePeriodIndex];

          // Generate unique ID for the variable
          const varId = `var_${Date.now()}_${i}`;

          // Parse formula string into formula array
          const formula = parseFormulaString(formulaStr, timePeriod);

          // Create variable
          variables.push({
            id: varId,
            name: varName,
            formula,
          });

          // Extract calculation values
          const calcs = Array(12).fill(0);
          monthIndices.forEach((idx, monthIdx) => {
            if (idx < columns.length) {
              const value = parseFloat(columns[idx]);
              if (!isNaN(value)) {
                calcs[monthIdx] = value;
              }
            }
          });

          calculations[varId] = calcs;
        }

        // Return the parsed data in the same format as JSON import
        resolve({
          variables,
          calculations,
        });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };
    reader.readAsText(file);
  });
}

// Helper function to parse CSV row properly, handling quoted values
function parseCSVRow(row: string): string[] {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];

    if (char === '"' && (i === 0 || row[i - 1] !== "\\")) {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current); // Add the last field
  return result;
}

// Helper function to parse formula string back into formula array
function parseFormulaString(formulaStr: string, timePeriod: string): any[] {
  if (!formulaStr.trim()) {
    return [];
  }

  const formula = [];
  const parts = formulaStr.split(/(\s+[\+\-\*\/]\s+)/);

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();

    // Check if this part is an operator
    if (/^[\+\-\*\/]$/.test(part)) {
      formula.push({
        type: "operator",
        operator: part,
      });
    }
    // Check if this part is a tag
    else if (part.length > 0) {
      // Try to extract name and value from format like "name (value)"
      const match = part.match(/(.+?)\s*\((\d+(?:\.\d+)?)\)/);

      if (match) {
        const [_, name, valueStr] = match;
        const value = parseFloat(valueStr);

        formula.push({
          type: "tag",
          id: `imported_${Date.now()}_${i}`,
          name: name.trim(),
          value,
          timePeriod,
        });
      }
    }
  }

  return formula;
}

// Combined import function that handles both JSON and CSV
export async function importFile(file: File) {
  const fileType = file.name.split(".").pop()?.toLowerCase();

  if (fileType === "json") {
    return importFromJSON(file);
  } else if (fileType === "csv") {
    return importFromCSV(file);
  } else {
    throw new Error("Unsupported file format. Please use JSON or CSV files.");
  }
}
