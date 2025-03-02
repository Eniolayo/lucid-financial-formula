import { create } from "zustand";

type FormulaItemType = "tag" | "operand" | "number";

type FormulaItem = {
  type: FormulaItemType;
  id?: string;
  name?: string;
  value: string | number;
  timePeriod?: string;
};

type FormulaState = {
  formula: FormulaItem[];
  activeTagIndex: number | null;
  addTag: (tag: {
    id: string;
    name: string;
    value: number;
    timePeriod?: string;
  }) => void;
  addOperand: (operand: string) => void;
  addNumber: (number: string) => void;
  removeLastItem: () => void;
  updateTag: (
    id: string,
    updatedTag: { id: string; name: string; value: number; timePeriod?: string }
  ) => void;
  removeTag: (id: string) => void;
  setFormula: (formula: FormulaItem[]) => void;
  setActiveTagIndex: (index: number | null) => void;
};

export const useFormulaStore = create<FormulaState>((set) => ({
  formula: [],
  activeTagIndex: null,

  addTag: (tag) =>
    set((state) => ({
      formula: [
        ...state.formula,
        {
          type: "tag",
          id: tag.id,
          name: tag.name,
          value: tag.value,
          timePeriod: tag.timePeriod || "This month",
        },
      ],
      activeTagIndex: null,
    })),

  addOperand: (operand) =>
    set((state) => ({
      formula: [
        ...state.formula,
        {
          type: "operand",
          value: operand,
        },
      ],
      activeTagIndex: null,
    })),

  addNumber: (number) =>
    set((state) => ({
      formula: [
        ...state.formula,
        {
          type: "number",
          value: number,
        },
      ],
      activeTagIndex: null,
    })),

  removeLastItem: () =>
    set((state) => {
      if (state.formula.length === 0) return state;

      const newFormula = [...state.formula];
      newFormula.pop();

      return {
        formula: newFormula,
        activeTagIndex: null,
      };
    }),

  updateTag: (id, updatedTag) =>
    set((state) => ({
      formula: state.formula.map((item) =>
        item.type === "tag" && item.id === id
          ? {
              type: "tag",
              id: updatedTag.id,
              name: updatedTag.name,
              value: updatedTag.value,
              timePeriod: updatedTag.timePeriod,
            }
          : item
      ),
    })),

  removeTag: (id) =>
    set((state) => ({
      formula: state.formula.filter(
        (item) => !(item.type === "tag" && item.id === id)
      ),
      activeTagIndex: null,
    })),

  setFormula: (formula) => set({ formula }),

  setActiveTagIndex: (index) => set({ activeTagIndex: index }),
}));
