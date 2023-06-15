import { PronounId, PronounVariable } from "./types.js";

export function number(singular: string, plural: string): PronounVariable {
    return {
        type: "PronounVariable",
        kind: "GrammaticalNumber",
        singular,
        plural,
        transform: "None",
    };
}

function pronounCase(pronounCase: (PronounVariable & { kind: "PronounsCase" })["case"]): PronounVariable {
    return {
        type: "PronounVariable",
        kind: "PronounsCase",
        case: pronounCase,
        transform: "None",
    };
}

function name(): PronounVariable {
    return {
        type: "PronounVariable",
        kind: "Name",
    };
}

export const pronounIdents: Record<string, PronounVariable> = {};

const addNumber = (singular: string, plural: string) => {
    const n = number(singular, plural);
    if (singular != "") {
        pronounIdents[singular] = n;
    }
    if (plural != "") {
        pronounIdents[plural] = n;
    }
};

const addPronounCase = (names: string[], pCase: (PronounVariable & { kind: "PronounsCase" })["case"]) => {
    const p = pronounCase(pCase);
    for (const name of names) {
        pronounIdents[name] = p;
    }
};

const addName = (names: string[]) => {
    const n = name();
    for (const name of names) {
        pronounIdents[name] = n;
    }
};

addNumber("s", "");
addNumber("is", "are");
addNumber("was", "were");
addNumber("has", "have");
addPronounCase(["they", "subject"], "Subject");
addPronounCase(["them", "object"], "Object");
addPronounCase(["their", "possessivedeterminer", "possessive_determiner", "possessive-determiner"], "PossessiveDeterminer");
addPronounCase(["theirs", "possessivepronoun", "possessive_pronoun", "possessive-pronoun"], "PossessivePronoun");
addPronounCase(["themselves", "themself", "reflexive"], "Reflexive");
addName(["name"]);

export function getPronounIdent(name: string): PronounVariable | null {
    const lowercaseName = name.toLowerCase();
    if (lowercaseName in pronounIdents) {
        const ident = { ...pronounIdents[lowercaseName] };
        if ("transform" in ident) {
            if (/^[A-Z]+$/.test(name)) {
                ident.transform = "UpperCase";
            } else if (/^[A-Z][a-z]+$/.test(name)) {
                ident.transform = "Capitalize";
            } else if (/^[a-z]+$/.test(name)) {
                ident.transform = "LowerCase";
            } else {
                ident.transform = "None";
            }
        }
        return ident;
    }
    return null;
}

export function transform(str: string, transform: (PronounVariable & { kind: "PronounsCase" })["transform"] | (PronounVariable & { kind: "GrammaticalNumber" })["transform"]) {
    switch(transform) {
        case "LowerCase":
            return str.toLowerCase();
        case "UpperCase":
            return str.toUpperCase();
        case "Capitalize":
            return str.substring(0, 1).toUpperCase() + str.substring(1).toLowerCase();
        case "None":
            return str;
    }
}

type Pronouns = {
    number: "Singular" | "Plural",
    subject: string,
    object: string,
    posessiveDeterminer: string,
    possessivePronoun: string,
    reflexive: string,
    transform: boolean,
};

function pronouns(number: "Singular" | "Plural",
    subject: string,
    object: string,
    posessiveDeterminer: string,
    possessivePronoun: string,
    reflexive: string,): Pronouns {
        return {
            number, subject, object, posessiveDeterminer, possessivePronoun, reflexive, transform: true
        };
}

function nounselfPronouns(number: "Singular" | "Plural", noun: string): Pronouns {
    return {
        number, subject: noun, object: noun, posessiveDeterminer: `${noun}'s`, possessivePronoun: `${noun}'s`, reflexive: `${noun}self`, transform: false
    };
}

const Singular: Pronouns["number"] = "Singular";
const Plural: Pronouns["number"] = "Plural";

const theythem = pronouns(
    Plural,
    "they",
    "them",
    "their",
    "theirs",
    "themselves/themself",
);
const hehim = pronouns(Singular, "he", "him", "his", "his", "himself");
const sheher = pronouns(Singular, "she", "her", "her", "hers", "herself");

const knownPronouns: Record<PronounId["id"] & string, Pronouns[]> = {
    aeaer: [pronouns(Singular, "ae", "aer", "aer", "aers", "aerself")],
    eem: [pronouns(Singular, "e", "em", "eir", "eirs", "eirself")],
    faefaer: [pronouns(Singular, "fae", "faer", "faer", "faers", "faerself")],
    hehim: [hehim],
    itits: [pronouns(Singular, "it", "it", "its", "its", "itself")],
    perper: [pronouns(Singular, "per", "per", "per", "pers", "perself")],
    sheher: [sheher],
    theythem: [theythem],
    vever: [pronouns(Singular, "ve", "ver", "ver", "vers", "verself")],
    xexem: [pronouns(Singular, "xe", "xem", "xyr", "xyrs", "xemself")],
    ziehir: [pronouns(Singular, "zie", "hir", "hir", "hirs", "hirself")],
    heshe: [hehim, sheher],
    any: [theythem, hehim, sheher],
    hethem: [hehim, theythem],
    shethem: [sheher, theythem],
    other: [],
};

export function displayPronounsVariable(id: PronounId, index: number, name: string, value: PronounVariable): string {
    let set: Pronouns[];
    if (id.id == null) {
        set = [];
    } else {
        set = knownPronouns[id.id];
    }
    if (set.length === 0) {
        set = [nounselfPronouns("Singular", name)];
    }
    const pronouns = set[index % set.length];
    switch(value.kind) {
        case "GrammaticalNumber":
            switch(pronouns.number) {
                case "Singular":
                    return transform(value.singular, value.transform);
                case "Plural":
                    return transform(value.plural, value.transform);
            }
        case "PronounsCase":
            switch(value.case) {
                case "Subject":
                    return transform(pronouns.subject, pronouns.transform ? value.transform : "None");
                case "Object":
                    return transform(pronouns.object, pronouns.transform ? value.transform : "None");
                case "PossessiveDeterminer":
                    return transform(pronouns.posessiveDeterminer, pronouns.transform ? value.transform : "None");
                case "PossessivePronoun":
                    return transform(pronouns.possessivePronoun, pronouns.transform ? value.transform : "None");
                case "Reflexive":
                    return transform(pronouns.reflexive, pronouns.transform ? value.transform : "None");
            }
        case "Name":
            return name;
    }
}
