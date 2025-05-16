// DDC Math interpreter library script, made by [tyuXX]

// Detailed commentary added:
// This interpreter converts a mathematical expression in string form into tokens,
// parses those tokens into an Abstract Syntax Tree (AST) using recursive descent,
// and then evaluates the AST to compute a result.
// Operators are categorized into direct (binary), aliasDirect (alternate binary), 
// func (function calls), and postfix (unary suffix operators).

const expressions = {
  // Direct binary operators with their priorities and functions.
  "+": {
    type: "direct",
    id: "addDirect",
    priority: 1,
    function: (a, b) => a + b,
  },
  "-": {
    type: "direct",
    id: "subtractDirect",
    priority: 1,
    function: (a, b) => a - b,
  },
  "*": {
    type: "direct",
    id: "multiplyDirect",
    priority: 2,
    function: (a, b) => a * b,
  },
  "/": {
    type: "direct",
    id: "divideDirect",
    priority: 2,
    function: (a, b) => a / b,
  },
  "^": {
    type: "direct",
    id: "powerCarret",
    priority: 3,
    function: (a, b) => Math.pow(a, b),
  },
  "%": {
    type: "direct",
    id: "moduloDirect",
    priority: 2,
    function: (a, b) => a % b,
  },
  // Function-style operator for modulo.
  mod: {
    type: "func",
    id: "modulo",
    priority: 2,
    function: (a, b) => a % b,
  },
  // Alias operator: "**" uses the power function defined by "^".
  "**": {
    type: "aliasDirect",
    id: "powerStar",
    priority: 3,
    function: "powerCarret",
  },
  // Postfix operators for factorial calculations.
  "!": {
    type: "postfix",
    id: "factorial",
    priority: 3,
    function: (a) => factorial(a),
  },
  "!!": {
    type: "postfix",
    id: "doubleFactorial",
    priority: 3,
    function: (a) => doubleFactorial(a),
  },
  // Function calls for various mathematical operations.
  pow: {
    type: "func",
    id: "power",
    function: (a, b) => Math.pow(a, b),
  },
  sin: {
    type: "func",
    id: "sin",
    function: (a) => Math.sin(a),
  },
  cos: {
    type: "func",
    id: "cos",
    function: (a) => Math.cos(a),
  },
  tan: {
    type: "func",
    id: "tan",
    function: (a) => Math.tan(a),
  },
  sqrt: {
    type: "func",
    id: "sqrt",
    function: (a) => Math.sqrt(a),
  },
  log: {
    type: "func",
    id: "log",
    // Supports an optional base (defaults to Math.E)
    function: (a, base = Math.E) => Math.log(a) / Math.log(base),
  },
  abs: {
    type: "func",
    id: "abs",
    function: (a) => Math.abs(a),
  },
  round: {
    type: "func",
    id: "round",
    function: (a) => Math.round(a),
  },
  decimal: {
    type: "func",
    id: "decimal",
    function: (a) => Number.parse(a.replace(".", ",")),
  },
};

// tokenize: Breaks the input expression into tokens (numbers, operators, identifiers, etc.).
function tokenize(expression) {
  const tokens = [];
  // Updated regex: Prioritizes multi-character operators like '**' and '!!'.
  const regex =
    /\d+(?:\.\d+)?|(?:\*\*|!!|\^|%|\+|\-|\*|\/|!)|[A-Za-z_]\w*|[(),]|[()]|\s+/g;
  let match;

  while ((match = regex.exec(expression)) !== null) {
    if (!match[0].trim()) continue; // Skip whitespace characters.
    tokens.push(match[0]);
  }

  return tokens;
}

// parse: Converts tokens into an AST representing the expression.
// Employs recursive descent parsing with helper functions.
function parse(tokens) {
  let position = 0;

  // parsePrimary: Processes basic tokens – numbers, parenthesized expressions, and function calls.
  function parsePrimary() {
    const token = tokens[position++];
    let node;
    if (token === "(") {
      // Process expression inside parentheses.
      node = parseExpression(0);
      if (tokens[position++] !== ")") {
        throw new Error("Mismatched parentheses");
      }
    } else if (/^[A-Za-z_]\w*$/.test(token)) {
      // Process identifiers and function calls.
      const opInfo = expressions[token];
      if (opInfo && opInfo.type === "func") {
        if (tokens[position++] !== "(") {
          throw new Error("Expected '(' after function name");
        }
        const args = parseArguments();
        node = { type: "func", name: token, args };
      } else {
        throw new Error(`Unexpected token: ${token}`);
      }
    } else if (!isNaN(token)) {
      // Process numeric literal.
      node = { type: "number", value: parseFloat(token) };
    } else {
      throw new Error(`Unexpected token: ${token}`);
    }
    // Support for postfix operators (e.g., factorial, double factorial).
    while (tokens[position] === "!" || tokens[position] === "!!") {
      const op = tokens[position++];
      node = { type: "postfix", operator: op, argument: node };
    }
    return node;
  }

  // parseArguments: Parses comma-separated arguments within function calls.
  function parseArguments() {
    const args = [];
    if (tokens[position] === ")") {
      position++;
      return args;
    }
    while (true) {
      args.push(parseExpression(0));
      if (tokens[position] === ",") {
        position++;
      } else if (tokens[position] === ")") {
        position++;
        break;
      } else {
        throw new Error("Expected ',' or ')' in function arguments");
      }
    }
    return args;
  }

  // parseExpression: Builds binary operator expressions respecting operator precedence.
  function parseExpression(minPriority = 0) {
    let left = parsePrimary();
    while (position < tokens.length) {
      const op = tokens[position];
      const opInfo = expressions[op];
      if (!opInfo || (opInfo.type !== "direct" && opInfo.type !== "aliasDirect"))
        break;
      if (opInfo.priority < minPriority) break;
      position++;
      const right = parseExpression(opInfo.priority + 1);
      left = { type: op, left, right };
    }
    return left;
  }

  return parseExpression(0);
}

// factorial: Computes the factorial of a positive integer.
// Throws an error for negative inputs.
function factorial(n) {
  if (n < 0) throw new Error("Factorial is not defined for negative numbers");
  if (n === 0) return 1;
  let result = 1;
  for (let i = 1; i <= Math.floor(n); i++) {
    result *= i;
  }
  return result;
}

// doubleFactorial: Computes the double factorial of a number.
// Returns 1 for n = 0 or n = -1.
function doubleFactorial(n) {
  if (n < 0) throw new Error("Double factorial is not defined for negative numbers");
  if (n === 0 || n === -1) return 1;
  let result = 1;
  for (let i = Math.floor(n); i > 0; i -= 2) {
    result *= i;
  }
  return result;
}

// getOperationById: Finds an operator definition within expressions by its unique id.
function getOperationById(id) {
  for (const key in expressions) {
    if (expressions[key].id === id) return expressions[key];
  }
  return null;
}

// evaluate: Recursively computes the value of an AST node.
// Supports numbers, postfix operations, function calls, and binary operators.
function evaluate(node) {
  switch (node.type) {
    case "number":
      return node.value;
    case "postfix": {
      const value = evaluate(node.argument);
      return expressions[node.operator].function(value);
    }
    case "func": {
      const op = expressions[node.name];
      if (!op) throw new Error(`Unknown function: ${node.name}`);
      const args = node.args.map(evaluate);
      return op.function(...args);
    }
    default: {
      const operation = expressions[node.type];
      if (operation) {
        switch (operation.type) {
          case "direct":
            return operation.function(evaluate(node.left), evaluate(node.right));
          case "aliasDirect": {
            const op = getOperationById(operation.function);
            if (!op) throw new Error(`Unknown operation: ${operation.id}`);
            return op.function(evaluate(node.left), evaluate(node.right));
          }
        }
      }
      throw new Error(`Unknown operation: ${node.type}`);
    }
  }
}

// EvaluateMath: Entry point that ties tokenization, parsing, and evaluation.
// Validates that the input is not empty before processing.
function EvaluateMath(expression) {
  if(expression.trim() === "") {
    throw new Error("Expression cannot be empty");
  }
  const tokens = tokenize(expression);
  const ast = parse(tokens);
  const result = evaluate(ast);
  return result;
}

// Expose EvaluateMath globally for usage.
globalThis.EvaluateMath = EvaluateMath;

// Example usage:
// const result = EvaluateMath("2 + 3 * 4");

// This will be a math interpreter, it will take in text, safely evaluate it according to the expressions
// (parentheses should function like they do in math, be able to work with advanced mathematics) and return the answer.
