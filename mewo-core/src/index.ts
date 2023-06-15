import { Streams } from "@masala/parser";
import { parser } from "./command/parser.js";
import { compileText } from "./command/compiler.js";
import { User } from "./command/types.js";
import { CommandContext, GlobalContext } from "./command/context.js";
import { compileContext } from "./command/built-in.js";
import * as commands from "mewo-commands";

console.log(`sum: ${commands.sum(2,3)}`);

const parseResult = parser.parse(Streams.ofString("Hello ${<name>}... ${They} ${sender.are} cute! The time is ${time('Europe/Vienna')}."));
const runner = compileText(compileContext, parseResult.value);
const command = "I am Nya";
const regex = new RegExp("I\\s+am\\s+(?<name>.*)");

const match = command.match(regex);
const user: User = {
    type: "User",
    displayName: "liquidnya",
    name: "liquidnya",
    id: "<unknown>"
}

if (match != null) {
    const commandContext = new CommandContext(new GlobalContext(), command, user, match.groups);
    try {
        const result = runner.run(commandContext);
        console.log(result);
    } catch (err) {
        // ignore err
        // TODO: check for assertion error
    }
}
