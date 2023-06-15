import { CommandPropertyEvaluation, CompileContext } from "./compiler.js";
import { CommandContext } from "./context.js";
import { getPronounIdent, number } from "./pronouns.js";
import { RuntimeType, RuntimeValue, User } from "./types.js";

function nullRunner(): { types: RuntimeType[]; run: () => null } {
    return {
        types: ["null"],
        run() {
            return null;
        },
    };
}

function userProperty(thisArg: RuntimeType[], result: RuntimeType[], fn: (context: CommandContext, user: User) => RuntimeValue): CommandPropertyEvaluation {
    if (!result.includes("null")) {
        result.push("null");
    }
    if (!thisArg.includes("User") && !thisArg.includes("string")) {
        // TODO: warning, unexpected property
    }
    return {
        run(context, thisArg) {
            const user = context.getUser(thisArg);
            if (user != null) {
                return fn(context, user);
            } else {
                return null;
            }
        },
        types: result
    }
}

export const compileContext: CompileContext = {
    useCommandArguments(from, to) {
        // noop
    },
    useCaptureGroup(name) {
        // noop
    },
    useCommandArgument(argument) {
        // noop
    },
    getFunction(name, args) {
        if (name == "assert") {
            if (args.length >= 1) {
                if (args.length > 1) {
                    // TODO: unexpected argument length -> fallback to drop other arguments
                }
                return {
                    run(_context, args) {
                        if (!args[0]) {
                            // TODO: change Error type
                            throw new Error("Assertion Error");
                        }
                        return args[0];
                    },
                    // FIXME: make all types a constant
                    types: ["boolean", "PronounId", "PronounVariable", "User", "null", "string"]
                };
            } else {
                // TODO: unexpected argument length
            }
        }
        if (name == "void") {
            return nullRunner();
        }
        if (name == "time") {
            if (args.length > 1) {
                // TODO: unexpected argument length -> fallback to drop other arguments
            }
            return {
                run(_context, args) {
                    try {
                        if (args.length >= 1 && typeof args[0] === "string") {
                            return (new Date()).toLocaleString("en", {
                                timeZone: args[0],
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false,
                            });
                        } else {
                            return (new Date()).toLocaleString("en", {
                                timeZone: "UTC",
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false,
                            });
                        }
                    } catch (err) {
                        return null;
                    }
                },
                types: ["string", "null"]
            };
        }
        // TODO: warning, unexpected function
        return nullRunner();
    },
    getIdent(name) {
        if (name == "sender") {
            return {
                run(context) {
                    return context.getSender();
                },
                types: ["User"]
            };
        } else if (name == "broadcaster") {
            return {
                run(context) {
                    return context.getBroadcaster();
                },
                types: ["User"]
            };
        } else if (name == "bot") {
            return {
                run(context) {
                    return context.getBot();
                },
                types: ["User"]
            };
        }
        const ident = getPronounIdent(name);
        if (ident != null) {
            return {
                run() {
                    return ident;
                },
                types: ["PronounVariable"]
            };
        }
        // TODO: warning, unexpected ident
        return nullRunner();
    },
    getMethod(name, thisArg, args) {
        if (name == "pronouns") {
            if (!thisArg.includes("User") && !thisArg.includes("string")) {
                // TODO: warning, unexpected method
            }
            if (args.length == 1) {
                if (!args[0].includes("PronounVariable")) {
                    // TODO: warning, unexpected argument type
                }
                return {
                    run(context, thisArg, args) {
                        const user = context.getUser(thisArg);
                        const ident = args[0];
                        if (typeof ident !== "object" || ident?.type != "PronounVariable") {
                            return null;
                        }
                        if (user != null) {
                            return context.displayPronouns(user, ident);
                        } else {
                            return null;
                        }
                    },
                    types: ["string", "null"]
                };
            } else if (args.length >= 2) {
                if (args.length > 2) {
                    // TODO: unexpected argument length -> ignoring arguments
                }
                if (!args[0].includes("string")) {
                    // TODO: warning, unexpected argument type
                }
                if (!args[1].includes("string")) {
                    // TODO: warning, unexpected argument type
                }
                return {
                    run(context, thisArg, args) {
                        const user = context.getUser(thisArg);
                        const singular = args[0];
                        const plural = args[1];
                        if (typeof singular !== "string" || typeof plural !== "string") {
                            return null;
                        }
                        if (user != null) {
                            return context.displayPronouns(user, number(singular, plural));
                        } else {
                            return null;
                        }
                    },
                    types: ["string", "null"]
                };
            } else {
                // TODO: unexpected argument length
            }
        }
        return nullRunner();
    },
    getProperty(name, thisArg) {
        if (name == "game") {
            return userProperty(thisArg, ["string", "null"], (context, user) => {
                return context.getGame(user);
            });
        } else if (name == "id") {
            return userProperty(thisArg, ["string"], (context, user) => {
                return user.id;
            });
        } else if (name == "name") {
            return userProperty(thisArg, ["string"], (context, user) => {
                return user.name;
            });
        } else if (name == "displayName") {
            return userProperty(thisArg, ["string"], (context, user) => {
                return user.displayName;
            });
        }
        const ident = getPronounIdent(name);
        if (ident != null) {
            return userProperty(thisArg, ["string"], (context, user) => {
                return context.displayPronouns(user, ident);
            });
        }
        // TODO: warning, unexpected property
        return nullRunner();
    },
};