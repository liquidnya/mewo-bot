# mewo-bot
A twitch chat bot for utility commands.

## Command Syntax

### `${user}`
The user sending the command:

- `${user.id}` - The user id
- `${user.name}` - The username of the user
- `${user.displayName}` - The display name of the user
- `${user}` - Shortcut for the display name
- `${user.pronouns(They)}`, `${user.pronouns(themselves)}`, `${user.pronouns(is are)}`, `${user.pronouns(s)}` - The pronoun of the user or in the case of `is are` it chooses `is` if the pronoun is singular or `are` if the pronoun is plural, or `s` prints `s` only if the pronoun is singular
- `${user.game}` - The game the user was last streaming
- `${user.link}` - The link to their channel

### `${broadcaster}`, `${target}`, `${0}`, `${1}`, etc.
- `${broadcaster}` - The broadcaster, can be used with `${broadcaster.game}` etc.
- `${target}` - The target user of the first argument of the command, can be used with `${target.id}` etc.
- `${0}` - The name of the command (0th argument)
- `${1}` - The first argument
- `${-1}` - The last argument
- `${-2}` - The 2nd to last argument
- `${1:}` - All arguments except the command name
- `${1:2}` - The first two arguments
- `${-4:-2}` - The 2nd to last, 3rd last and 4th last arguments
- `${<name>}` - The capture group from a regex command, for example `${<var>}` will print the capture group named `var`.

Hint: use `${assert(3)}` to run the command only if there are 3 arguments.

### `${assert(x)}`, `${if(x 'i')}`, `${if(x 'i' 'e')}`

Can be used to make a response appear only if a certain condition is met.
For example `${assert(target)}` will only respond if there is an argument for the command and the argument is a valid user.
Can be negated with `${assert(!x)}`.
With `${if(x 'i')}` you can print `i` only if `x` is present/true and with `${if(x 'i' 'e')}` it prints `i` if the condition `x` is met, but otherwise prints `e`.
For example `${if(target.game '${target.pronouns(They)} ${target.pronouns(was,were)} last playing ${target.game}.' 'It is not known what game ${target.pronouns(they) last played!'})}` would print `She was last playing Super Mario Maker 2.` if the target user goes by she/her and was last playing Super Mario Maker 2, but if they go by they/them and don't have any game set then this will print `It is not know what game they last played!`.

### Other variables

- `${time}`, `${time(zoneid)}` - Prints the time, `zoneid` can be used to set the timezone
- `${random(a b)}` - Picks a random number between `a` and `b` (both inclusive)
- `${random('a')}`, `${random('a' 'b')}`, etc. - Prints a random option.
- `${random(x%'a' y%'b' 'c')}` etc. - Uses `x` as a percentage to pick `a`, `y` as a percentage to pick `b`, and `c` is the rest percentage. For example: `${random(5%'meow' 20%'mewo' 'uwu')}`. Note if you use a percent for each option then it will be weighted by the total, if the last option does not have a percent the total weight will be `100`.
