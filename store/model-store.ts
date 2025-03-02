import { create } from "zustand";
import { calculateFormulaWithTags } from "@/lib/time-utils";

export type Variable = {
  id: string;
  name: string;
  formula: Array<{
    type: "tag" | "operator";
    id?: string;
    name?: string;
    value?: number;
    timePeriod?: string;
    operator?: string;
  }>;
};

type ModelState = {
  variables: Variable[];
  calculations: Record<string, number[]>;
  errors: string[];
  addVariable: () => void;
  updateVariable: (id: string, variable: Variable) => void;
  deleteVariable: (id: string) => void;
  setVariables: (variables: Variable[]) => void;
  clearErrors: () => void;
};

export const useModelStore = create<ModelState>((set, get) => ({
  variables: [],
  calculations: {},
  errors: [],

  addVariable: () => {
    const id = `var_${Date.now()}`;
    set((state) => ({
      variables: [
        ...state.variables,
        {
          id,
          name: `Variable ${state.variables.length + 1}`,
          formula: [],
        },
      ],
    }));
  },

  updateVariable: (id: string, variable: Variable) => {
    set((state) => {
      const newVariables = state.variables.map((v) =>
        v.id === id ? variable : v
      );
      console.log(newVariables, "newVariables");

      // Recalculate all formulas since variables might depend on each other
      const { calculations, errors } = calculateAllFormulas(newVariables);

      return {
        variables: newVariables,
        calculations,
        errors,
      };
    });
  },

  deleteVariable: (id: string) => {
    set((state) => {
      const newVariables = state.variables.filter((v) => v.id !== id);
      const { calculations, errors } = calculateAllFormulas(newVariables);

      return {
        variables: newVariables,
        calculations,
        errors,
      };
    });
  },

  setVariables: (variables: Variable[]) => {
    const { calculations, errors } = calculateAllFormulas(variables);
    set({ variables, calculations, errors });
  },

  clearErrors: () => set({ errors: [] }),
}));

function calculateAllFormulas(variables: Variable[]) {
  const calculations: Record<string, number[]> = {};
  const errors: string[] = [];

  variables.forEach((variable) => {
    try {
      if (variable.formula.length === 0) {
        calculations[variable.id] = Array(12).fill(0);
        return;
      }

      const monthlyValues = calculateFormulaWithTags(
        variable.formula,
        variables
      );
      calculations[variable.id] = monthlyValues;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`Error in variable "${variable.name}": ${message}`);
      calculations[variable.id] = Array(12).fill(0);
    }
  });

  return { calculations, errors };
}
