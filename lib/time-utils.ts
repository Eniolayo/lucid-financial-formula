export function applyTimePeriod(
  baseValue: number,
  timePeriod: string
): number[] {
  const months = Array(12).fill(baseValue);

  switch (timePeriod) {
    case "This Month":
      return months.map((_, i) =>
        i === new Date().getMonth() ? baseValue : 0
      );

    case "Previous Month":
      const prevMonth = new Date().getMonth() - 1;
      return months.map((_, i) => (i === prevMonth ? baseValue : 0));

    case "1 Year Ago":
      return months.map((_, i) =>
        i === new Date().getMonth() ? baseValue : 0
      );

    case "Last 3 Months":
      const currentMonth = new Date().getMonth();
      return months.map((_, i) => {
        const diff = currentMonth - i;
        return diff >= 0 && diff < 3 ? baseValue : 0;
      });

    case "Last 12 Months":
      return months;

    case "Calendar YTD":
      const ytdMonth = new Date().getMonth();
      return months.map((_, i) => (i <= ytdMonth ? baseValue : 0));

    case "Cumulative":
      let sum = 0;
      return months.map(() => (sum += baseValue));

    case "All Months":
      return months;

    case "Custom":
      // For custom, we'll just return the base value for all months
      // This would be enhanced based on user-defined custom periods
      return months;

    default:
      return months;
  }
}

/**
 * Evaluates a mathematical expression following BODMAS order of operations.
 * Handles: Brackets, Orders (powers), Division, Multiplication, Addition, Subtraction
 */
export function evaluateExpression(tokens: any[]): number[] {
  // Initialize results array for 12 months
  const results = Array(12).fill(0);

  // First, convert the tokens into a postfix notation for each month
  for (let month = 0; month < 12; month++) {
    const postfixExpression = convertToPostfix(tokens, month);
    results[month] = evaluatePostfix(postfixExpression);
  }

  return results;
}

/**
 * Converts infix tokens to postfix notation for a specific month
 */
function convertToPostfix(tokens: any[], month: number) {
  const output: any[] = [];
  const operators: string[] = [];
  const precedence: Record<string, number> = {
    "+": 1,
    "-": 1,
    "*": 2,
    "/": 2,
    "^": 3,
  };

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.type === "tag") {
      // Get the monthly value for this tag based on its time period
      const monthlyValues =
        token.value !== undefined
          ? applyTimePeriod(token.value, token.timePeriod || "This Month")
          : Array(12).fill(0);

      output.push(monthlyValues[month]);
    } else if (token.type === "operator") {
      const op = token.operator;

      if (op === "(") {
        operators.push(op);
      } else if (op === ")") {
        while (
          operators.length > 0 &&
          operators[operators.length - 1] !== "("
        ) {
          output.push(operators.pop());
        }
        // Remove the '(' from the stack
        if (operators.length > 0 && operators[operators.length - 1] === "(") {
          operators.pop();
        }
      } else {
        while (
          operators.length > 0 &&
          operators[operators.length - 1] !== "(" &&
          precedence[operators[operators.length - 1]] >= precedence[op]
        ) {
          output.push(operators.pop());
        }
        operators.push(op);
      }
    }
  }

  // Pop any remaining operators
  while (operators.length > 0) {
    output.push(operators.pop());
  }

  return output;
}

/**
 * Evaluates a postfix expression
 */
function evaluatePostfix(postfix: any[]): number {
  const stack: number[] = [];

  for (let i = 0; i < postfix.length; i++) {
    const token = postfix[i];

    if (typeof token === "number") {
      stack.push(token);
    } else {
      const b = stack.pop() || 0;
      const a = stack.pop() || 0;

      switch (token) {
        case "+":
          stack.push(a + b);
          break;
        case "-":
          stack.push(a - b);
          break;
        case "*":
          stack.push(a * b);
          break;
        case "/":
          if (b === 0) throw new Error("Division by zero");
          stack.push(a / b);
          break;
        case "^":
          stack.push(Math.pow(a, b));
          break;
      }
    }
  }

  return stack[0] || 0;
}

/**
 * Update the calculateFormulaWithTags function to use the BODMAS evaluator
 */
export function calculateFormulaWithTags(
  formula: Array<{
    type: "tag" | "operator";
    id?: string;
    name?: string;
    value?: number;
    timePeriod?: string;
    operator?: string;
  }>
): number[] {
  if (formula.length === 0) {
    return Array(12).fill(0);
  }

  try {
    return evaluateExpression(formula);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Formula evaluation error: ${message}`);
  }
}
