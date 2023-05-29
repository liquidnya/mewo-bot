# mewo-bot

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
For example `${if(target.game '${target.pronouns(They)} ${target.pronouns(was were)} last playing ${target.game}.' 'It is not known what game ${target.pronouns(they) last played!'})}` would print `She was last playing Super Mario Maker 2.` if the target user goes by she/her and was last playing Super Mario Maker 2, but if they go by they/them and don't have any game set then this will print `It is not know what game they last played!`.

### Other variables

- `${time}`, `${time(zoneid)}` - Prints the time, `zoneid` can be used to set the timezone
- `${random(a b)}` - Picks a random number between `a` and `b` (both inclusive)
- `${random('a')}`, `${random('a' 'b')}`, etc. - Prints a random option.
- `${random(x%'a' y%'b' 'c')}` etc. - Uses `x` as a percentage to pick `a`, `y` as a percentage to pick `b`, and `c` is the rest percentage. For example: `${random(5%'meow' 20%'mewo' 'uwu')}`. Note if you use a percent for each option then it will be weighted by the total, if the last option does not have a percent the total weight will be `100`.

### Syntax description

#### Text

A text will be replaced with the following rules:

- `${` _x_ `}` will be replaced by evaluting _x_ (_x_ is an expression).
- `\$` will be replaced by `$`.
- `\'` will be replaced by `'` (only if surrounded by `'` in an expression).
- `\"` will be replaced by `"` (only if surrounded by `"` in an expression).
- `\\` will be replaced by `\`.
- Every other text stays as is.

#### Expression

An expression is one of the following:

- A function with 0 arguments which is just an identifier will be replaced by evaluating the function (this is used for variables as well which are functions with 0 arguments)
- A function with 1 or more arguments which is an identifier + `(` + arguments + `)` will be replaced by evaluating its arguments and then evaluating the function passing the arguments
- A capure group which is `<` + identifier + `>` which will be replaced by the value of the capture group in the regex
- A number followed by `:` and another number wich will be replaced by the argument range
- A number _n_ which will be replaced by the *n*th argument
- An expression followed by `.` follwed by a method which will be replaced by evaluating the expression on the left and calling the method with that argument
- `!` followed by an expression will turn the evalutation of the expression from `null` to `true`, `false` to `true`, `true` to `false`, a user to `false`, the empty string `""` to `true`, any other string to `false`.
- `'` + _text_ + `'` or `"` + _text_ + `"` will be evaluated as text.
- A number followed by `%` then followed by an expression will return an object with the properties `chance` set to the number, `value` to the evaluation of the expression and a `toString()` method to print the value.

#### Identifiers

Are alphanumeric words.

#### Evaluations

A `string` will be printed as is. A `number` will be printed as the number. `null`, `true`, `false` will be printed as the empty string `""`. An `object` will use the `toString()` method to be printed. (User objects will print the display name by default)

#### Functions

- `user` - The user using the command
- `broadcaster` - The broadcaster
- `target` - The user of the first argument of the command
- `assert(` _a_:expression `)` - Evaluates `!!` + _a_ and if the value is `false` does not print a command response.
- `if(` _a_:expression space _b_:expression `)` - Evaluates `!!` + _a_ and will be replaced by evaluating _b_ if `!!` + _a_ is `true`, otherwise will be replaced by the empty string `""`.
- `if(` _a_:expression space _b_:expression space _c_:expression `)` - Evaluates `!!` + _a_ and will be replaced by evaluating _b_ if `!!` + _a_ is `true`, otherwise will be replaced by evaluating _c_.
