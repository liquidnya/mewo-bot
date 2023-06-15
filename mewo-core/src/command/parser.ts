import {
  Streams,
  N,
  C,
  F,
  SingleParser,
  Option,
  VoidParser,
} from "@masala/parser";

function whitespace(): SingleParser<string> {
  return C.charIn("\t\n\u000B\u000C\r \u0085\u200E\u200F\u2028\u2029");
}

function flatten(text: Text): Text {
  const result: Text = [];
  let buildString: string[] = [];
  for (const item of text.flatMap((x) => (Array.isArray(x) ? x : [x]))) {
    if (typeof item === "string") {
      buildString.push(item);
    } else {
      if (buildString.length > 0) {
        result.push(buildString.join(""));
        buildString = [];
      }
      result.push(item);
    }
  }
  if (buildString.length > 0) {
    result.push(buildString.join(""));
  }
  return result;
}

function text(options?: { quotes?: string | null }): SingleParser<Text> {
  const DEFAULT_OPTIONS = { quotes: null };
  const resolvedOptions = { ...DEFAULT_OPTIONS, ...(options ?? {}) };
  const escapes = ["\\$", "\\\\"];
  if (resolvedOptions.quotes != null) {
    for (const quote of resolvedOptions.quotes) {
      escapes.push(`\\${quote}`);
    }
  }
  const special = C.stringIn(escapes)
    .map((x) => x.substring(1))
    .or(
      C.string("${")
        .drop()
        .then(
          whitespace()
            .optrep()
            .drop()
            .then(F.lazy(expression))
            .then(whitespace().optrep().then(C.string("}")).drop())
            .single()
        )
    );
  const parser = F.try(special)
    .or(
      resolvedOptions.quotes == null
        ? F.any()
        : C.charNotIn(resolvedOptions.quotes)
    )
    .rep()
    .map((x) => flatten(x.array()));
  return parser;
}

export type Text = (string | Expression)[];

export type Expression =
  | Not
  | Function
  | Ident
  | Method
  | Property
  | CaptureGroup
  | CommandArgument
  | CommandArguments
  | Text;

export type Not = {
  type: "not";
  expression: Expression;
};

export type CaptureGroup = {
  type: "captureGroup";
  name: string;
};

export type CommandArgument = {
  type: "commandArgument";
  argument: number;
};

export type CommandArguments = {
  type: "commandArguments";
  from: number;
  to: number;
};

export type Function = {
  type: "function";
  name: string;
  arguments: Expression[];
};

export type Ident = {
  type: "ident";
  name: string;
};

export type Method = {
  type: "method";
  name: string;
  thisArgument: Expression;
  arguments: Expression[];
};

export type Property = {
  type: "property";
  name: string;
  thisArgument: Expression;
};

function expression(): SingleParser<Expression> {
  const not: SingleParser<Not> = C.char("!")
    .drop()
    .then(F.lazy(expression).map((x): Not => ({ type: "not", expression: x })))
    .single();
  const captureGroup = C.char("<")
    .then(whitespace().optrep())
    .drop()
    .then(
      C.utf8Letter()
        .rep()
        .map((x): CaptureGroup => ({ type: "captureGroup", name: x.join() }))
    )
    .then(whitespace().optrep().then(C.char(">")).drop())
    .single();
  const numbers = N.integer()
    .then(
      whitespace()
        .optrep()
        .then(C.char(":"))
        .then(whitespace().optrep())
        .drop()
        .then(N.integer())
        .single()
        .opt()
    )
    .map((x): CommandArgument | CommandArguments => {
      let from = x.at(0) as number;
      let optionalArg = x.at(1) as Option<number>;
      return optionalArg
        .map((to): CommandArguments => ({ type: "commandArguments", from, to }))
        .orElse({ type: "commandArgument", argument: from });
    });
  const t = C.charIn("'\"").flatMap((quotes: string) => {
    return text({ quotes }).then(C.charIn(quotes).drop()).single();
  });
  const args: SingleParser<Expression[]> = F.lazy(expression).flatMap(
    (firstArgument: Expression) => {
      return whitespace()
        .optrep()
        .then(C.char(",").then(whitespace().optrep()))
        .drop()
        .then(F.lazy(expression))
        .optrep()
        .map((x) => {
          return [firstArgument, ...x.array()];
        });
    }
  );
  // using try to look ahead if there is a `(`, `.` or `,`
  const brackets = F.try(
    whitespace()
      .optrep()
      .then(C.char("("))
      .then(whitespace().optrep())
      .drop()
      .then(
        C.char(")")
          .drop()
          .map((): Expression[] => [])
          .or(
            args.then(whitespace().optrep().then(C.char(")")).drop()).single()
          )
      )
      .single()
  ).or(F.returns(null));
  const fn = C.utf8Letter()
    .rep()
    .map((x) => x.join())
    .flatMap((name: string) => {
      return brackets.map((x: Expression[] | null): Ident | Function => {
        if (x == null) {
          return {
            type: "ident",
            name,
          };
        } else {
          return {
            type: "function",
            name,
            arguments: x,
          };
        }
      });
    });
  const methods = (e: Expression): SingleParser<Expression> => {
    // using try to look ahead if there is a `(`, `.` or `,`
    return F.try(
      whitespace()
        .optrep()
        .then(C.char("."))
        .then(whitespace().optrep())
        .drop()
        .then(fn)
        .single()
        .optrep()
        .map((methods) => {
          let thisArgument: Expression = e;
          for (const method of methods.array()) {
            if (method.type === "function") {
              thisArgument = {
                type: "method",
                name: method.name,
                thisArgument,
                arguments: method.arguments,
              };
            } else {
              thisArgument = {
                type: "property",
                name: method.name,
                thisArgument,
              };
            }
          }
          return thisArgument;
        })
    );
  };
  return not.or(captureGroup.or(t).or(numbers).or(fn).flatMap(methods));
}

export const parser = text().then(F.eos().drop()).single();
