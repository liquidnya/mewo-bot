import { displayPronounsVariable } from "./pronouns.js";
import { PronounId, PronounVariable, RuntimeValue, User } from "./types.js";

export class GlobalContext {
    getGame(user: User): string | null {
        throw new Error("Method not implemented.");
    }
    getBot(): User {
        throw new Error("Method not implemented.");
    }
    getUser(name: string): User | null {
        throw new Error("Method not implemented.");
    }
    getBroadcaster(): User {
        throw new Error("Method not implemented.");
    }
}

export class CommandContext {
    private globalContext: GlobalContext;
    private message: string[];
    private captures: Record<string, string>;
    private user: User;
    private pronounsIndex: number;

    constructor(
        globalContext: GlobalContext,
        message: string,
        user: User,
        captures?: Record<string, string>
    ) {
        this.globalContext = globalContext;
        this.message = message.split(/\s+/).filter((x) => x != "");
        this.user = user;
        this.captures = captures ?? {};
        this.pronounsIndex = Math.floor(
            Math.random() * 100_000
        );
    }
    getSender(): User {
        return this.user;
    }
    getBot(): User {
        return this.globalContext.getBot();
    }
    getBroadcaster(): User {
        return this.globalContext.getBroadcaster();
    }
    getUser(value: RuntimeValue): User | null {
        if (typeof value === "object" && value?.type === "User") {
            return value;
        } else if (typeof value === "string") {
            return this.globalContext.getUser(value);
        } else {
            return null;
        }
    }
    getGame(user: User): string | null {
        return this.globalContext.getGame(user);
    }
    commandArguments(from: number, to: number): string | null {
        throw new Error("Method not implemented.");
    }
    commandArgument(argument: number): string | null {
        if (argument < 0) {
            if (argument < -this.message.length) {
                return null;
            } else {
                return this.message[this.message.length + argument];
            }
        } else {
            if (argument < this.message.length) {
                return this.message[argument];
            } else {
                return null;
            }
        }
    }
    captureGroup(name: string): string | null {
        if (name in this.captures) {
            return this.captures[name];
        } else {
            return null;
        }
    }
    getPronouns(user: User): PronounId {
        return {
            type: "PronounId",
            id: "shethem",
        };
    }
    displayPronouns(user: User, value: PronounVariable): string {
        return displayPronounsVariable(this.getPronouns(user), this.pronounsIndex, user.displayName, value);
    }
    display(value: RuntimeValue): string {
        if (typeof value === "string") {
            return value;
        }
        if (value === null || typeof value === "boolean") {
            return "";
        }
        switch (value.type) {
            case "User":
                break;
            case "PronounId":
                break;
            case "PronounVariable":
                return this.displayPronouns(this.getSender(), value);
        }
        return String(value);
    }
}
