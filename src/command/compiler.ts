import { CommandContext } from "./context.js";
import {
  CaptureGroup,
  CommandArgument,
  CommandArguments,
  Expression,
  Not,
  Text,
  Function,
  Ident,
  Method,
  Property,
} from "./parser.js";
import { RuntimeType, RuntimeTypes, RuntimeValue } from "./types.js";

export type CommandEvaluation<T> = {
  run(context: CommandContext): T;
  types: RuntimeType[];
};

export type CommandIdentEvaluation<R = RuntimeValue> = {
  run(context: CommandContext): R;
  types: RuntimeType[];
};

export type CommandFunctionEvaluation<A = RuntimeValue, R = RuntimeValue> = {
  run(context: CommandContext, args: A[]): R;
  types: RuntimeType[];
};

export type CommandMethodEvaluation<
  T = RuntimeValue,
  A = RuntimeValue,
  R = RuntimeValue
> = {
  run(context: CommandContext, thisArg: T, args: A[]): R;
  types: RuntimeType[];
};

export type CommandPropertyEvaluation<T = RuntimeValue, R = RuntimeValue> = {
  run(context: CommandContext, thisArg: T): R;
  types: RuntimeType[];
};

export type CompileContext = {
  useCommandArguments(from: number, to: number): void;
  useCommandArgument(argument: number): void;
  useCaptureGroup(name: string): void;
  getIdent(name: string): CommandIdentEvaluation;
  getFunction(name: string, args: RuntimeType[][]): CommandFunctionEvaluation;
  getProperty(name: string, thisArg: RuntimeType[]): CommandPropertyEvaluation;
  getMethod(
    name: string,
    thisArg: RuntimeType[],
    args: RuntimeType[][]
  ): CommandMethodEvaluation;
};

function defer<T extends keyof RuntimeTypes>(
  types: T[],
  runFn: (context: CommandContext) => RuntimeTypes[T]
): CommandEvaluation<RuntimeTypes[T]> {
  return {
    run: runFn,
    types,
  };
}

function compileNot(
  compileContext: CompileContext,
  expression: Not
): CommandEvaluation<boolean> {
  const inner = compileExpression(compileContext, expression.expression);
  return defer(["boolean"], (context) => {
    const value = inner.run(context);
    return !value;
  });
}

function compileCaptureGroup(
  compileContext: CompileContext,
  expression: CaptureGroup
): CommandEvaluation<string | null> {
  compileContext.useCaptureGroup(expression.name);
  return defer(["string", "null"], (context) =>
    context.captureGroup(expression.name)
  );
}

function compileCommandArgument(
  compileContext: CompileContext,
  expression: CommandArgument
): CommandEvaluation<string | null> {
  compileContext.useCommandArgument(expression.argument);
  return defer(["string", "null"], (context) =>
    context.commandArgument(expression.argument)
  );
}

function compileCommandArguments(
  compileContext: CompileContext,
  expression: CommandArguments
): CommandEvaluation<string | null> {
  compileContext.useCommandArguments(expression.from, expression.to);
  return defer(["string", "null"], (context) =>
    context.commandArguments(expression.from, expression.to)
  );
}

function compileFunction(
  compileContext: CompileContext,
  expression: Function
): CommandEvaluation<RuntimeValue> {
  const args = expression.arguments.map((exp) =>
    compileExpression(compileContext, exp)
  );
  const fn = compileContext.getFunction(
    expression.name,
    args.map((arg) => arg.types)
  );
  return {
    run(context: CommandContext): RuntimeValue {
      return fn.run(
        context,
        args.map((arg) => arg.run(context))
      );
    },
    types: fn.types,
  };
}

function compileIdent(
  compileContext: CompileContext,
  expression: Ident
): CommandEvaluation<RuntimeValue> {
  return compileContext.getIdent(expression.name);
}

function compileMethod(
  compileContext: CompileContext,
  expression: Method
): CommandEvaluation<RuntimeValue> {
  const thisArg = compileExpression(compileContext, expression.thisArgument);
  const args = expression.arguments.map((exp) =>
    compileExpression(compileContext, exp)
  );
  const fn = compileContext.getMethod(
    expression.name,
    thisArg.types,
    args.map((arg) => arg.types)
  );
  return {
    run(context: CommandContext): RuntimeValue {
      return fn.run(
        context,
        thisArg.run(context),
        args.map((arg) => arg.run(context))
      );
    },
    types: fn.types,
  };
}

function compileProperty(
  compileContext: CompileContext,
  expression: Property
): CommandEvaluation<RuntimeValue> {
  const thisArg = compileExpression(compileContext, expression.thisArgument);
  const fn = compileContext.getProperty(expression.name, thisArg.types);
  return {
    run(context: CommandContext): RuntimeValue {
      return fn.run(context, thisArg.run(context));
    },
    types: fn.types,
  };
}

function compileExpression(
  compileContext: CompileContext,
  expression: Expression
): CommandEvaluation<RuntimeValue> {
  if (Array.isArray(expression)) {
    return compileText(compileContext, expression);
  }
  switch (expression.type) {
    case "function":
      return compileFunction(compileContext, expression);
    case "not":
      return compileNot(compileContext, expression);
    case "ident":
      return compileIdent(compileContext, expression);
    case "method":
      return compileMethod(compileContext, expression);
    case "property":
      return compileProperty(compileContext, expression);
    case "captureGroup":
      return compileCaptureGroup(compileContext, expression);
    case "commandArgument":
      return compileCommandArgument(compileContext, expression);
    case "commandArguments":
      return compileCommandArguments(compileContext, expression);
  }
}

export function compileText(
  compileContext: CompileContext,
  text: Text
): CommandEvaluation<string> {
  const actions: CommandEvaluation<RuntimeValue>[] = [];
  for (const item of text) {
    if (typeof item === "string") {
      actions.push(defer(["string"], () => item));
    } else {
      actions.push(compileExpression(compileContext, item));
    }
  }
  return defer(["string"], (context) =>
    actions.map((action) => context.display(action.run(context))).join("")
  );
}
