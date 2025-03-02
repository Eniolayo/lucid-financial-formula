interface Variable {
  id: string
  name: string
  formula: string
  timePeriod: string
}

export function calculateFormula(formula: string, variables: Variable[]): number {
  if (!formula.trim()) return 0

  try {
    // Replace variable references with their values
    let processedFormula = formula
    variables.forEach((variable) => {
      const regex = new RegExp(`\\b${variable.name}\\b`, "g")
      // Use the first month's value as the base value
      const value = 0 // This would come from actual calculations
      processedFormula = processedFormula.replace(regex, value.toString())
    })

    // Basic validation
    if (!isValidFormula(processedFormula)) {
      throw new Error("Invalid formula")
    }

    // Create a safe evaluation context
    const evalContext = {
      __proto__: null,
      Math,
    }

    // Use Function constructor with a restricted context
    const result = new Function(...Object.keys(evalContext), `"use strict";return (${processedFormula});`)(
      ...Object.values(evalContext),
    )

    if (typeof result !== "number" || !isFinite(result)) {
      throw new Error("Invalid result")
    }

    return result
  } catch (error) {
    throw new Error("Invalid formula: " + error.message)
  }
}

function isValidFormula(formula: string): boolean {
  // Remove all whitespace
  formula = formula.replace(/\s/g, "")

  // Check for invalid characters
  if (!/^[0-9+\-*/().]+$/.test(formula)) {
    return false
  }

  // Check for balanced parentheses
  let parentheses = 0
  for (const char of formula) {
    if (char === "(") parentheses++
    if (char === ")") parentheses--
    if (parentheses < 0) return false
  }
  if (parentheses !== 0) return false

  // Check for consecutive operators
  if (/[+\-*/]{2,}/.test(formula)) {
    return false
  }

  return true
}

