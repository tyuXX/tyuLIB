// DDC Math interpreter library script, made by [tyuXX]

// Direct is "a {expression} b"
// Func is "{expression}(...)"
const expressions = {
  "+": {
    type: "direct",
    function: (a, b) => a + b,
  },
  "-": {
    type: "direct",
    function: (a, b) => a - b,
  },
  "*": {
    type: "direct",
    function: (a, b) => a * b,
  },
  "/": {
    type: "direct",
    function: (a, b) => a / b,
  },
  round: {
    type: "func",
    function: (a) => Math.round(a),
  },
};

function tokenize(expression) {
  const tokens = [];
  const regex = /\d+(?:\.\d+)?|[+\-*/()]|\s+/g;
  let match;

  while ((match = regex.exec(expression)) !== null) {
    if (!match[0].trim()) continue; // Skip whitespace
    tokens.push(match[0]);
  }

  return tokens;
}

function parse(tokens) {
  let position = 0;

  function parseExpression() {
    let node = parseTerm();

    while (
      position < tokens.length &&
      (tokens[position] === "+" || tokens[position] === "-")
    ) {
      const operator = tokens[position++];
      const right = parseTerm();
      node = { type: operator, left: node, right };
    }

    return node;
  }

  function parseTerm() {
    let node = parseFactor();

    while (
      position < tokens.length &&
      (tokens[position] === "*" || tokens[position] === "/")
    ) {
      const operator = tokens[position++];
      const right = parseFactor();
      node = { type: operator, left: node, right };
    }

    return node;
  }

  function parseFactor() {
    const token = tokens[position++];

    if (token === "(") {
      const node = parseExpression();
      if (tokens[position++] !== ")") {
        throw new Error("Mismatched parentheses");
      }
      return node;
    }

    if (!isNaN(token)) {
      return { type: "number", value: parseFloat(token) };
    }

    throw new Error(`Unexpected token: ${token}`);
  }

  return parseExpression();
}

function evaluate(node) {
  if (node.type === "number") {
    return node.value;
  }

  const operation = expressions[node.type];
  if (operation.type === "direct") {
    return operation.function(evaluate(node.left), evaluate(node.right));
  }

  throw new Error(`Unknown operation: ${node.type}`);
}

function EvaluateMath(expression) {
  const tokens = tokenize(expression);
  const ast = parse(tokens);
  const result = evaluate(ast);
  return result;
}

globalThis.EvaluateMath = EvaluateMath;

// Example usage:
// const result = EvaluateMath("2 + 3 * 4");

// This will be a math interpreter, it will take in text, safely evaluate it according to the expressions
// (parentheses should function like they do in math, be able to work with advanced mathematics) and return the answer.
