export type RuntimeTypes = {
  string: string;
  User: User;
  PronounId: PronounId;
  PronounVariable: PronounVariable;
  boolean: boolean;
  null: null;
};

export type User = {
  type: "User";
  id: string;
  name: string;
  displayName: string;
};

export type PronounId = {
  type: "PronounId";
  id:
    | "aeaer"
    // any pronouns => use he/she/they
    | "any"
    | "eem"
    | "faefaer"
    | "hehim"
    | "heshe"
    | "hethem"
    | "itits"
    | "perper"
    | "sheher"
    | "shethem"
    | "theythem"
    | "vever"
    | "xexem"
    | "ziehir"
    // other pronouns => use nounself pronouns of the name
    | "other"
    | null;
};

export type PronounVariable = {
  type: "PronounVariable";
} & (
  | {
      kind: "GrammaticalNumber";
      singular: string;
      plural: string;
      transform: "LowerCase" | "UpperCase" | "Capitalize" | "None";
    }
  | {
      kind: "PronounsCase";
      case:
        | "Subject"
        | "Object"
        | "PossessiveDeterminer"
        | "PossessivePronoun"
        | "Reflexive";
      transform: "LowerCase" | "UpperCase" | "Capitalize" | "None";
    }
  | {
      kind: "Name";
      // names are never transformed!
    }
);

export type RuntimeType = keyof RuntimeTypes;

export type RuntimeValue =
  | string
  | User
  | PronounId
  | PronounVariable
  | boolean
  | null;
