<h1 align="center">
  <img alt="" width="75" src="./logo.svg"/>
  <br>
  cucumber-node
</h1>
<p align="center">
  <b>Automated tests in plain language, for the Node.js test runner</b>
</p>

[Cucumber](https://github.com/cucumber) is a tool for running automated tests written in plain language. Because they're
written in plain language, they can be read by anyone on your team. Because they can be
read by anyone, you can use them to help improve communication, collaboration and trust on
your team.

⚠️ This is a new implementation of Cucumber built around the [Node.js test runner](https://nodejs.org/api/test.html). It's still in the pre-1.0.0 phase, so APIs and behaviour might change. The stable canonical implementation of Cucumber for JavaScript continues to be [@cucumber/cucumber](https://github.com/cucumber/cucumber-js) for now. ⚠️

## Install

cucumber-node is [available on npm](https://www.npmjs.com/package/@cucumber/node):

```shell
npm install --save-dev @cucumber/node
```

You'll need Node.js 22 or 23.

## Get started

Say we have this small class:

```js
export class Greeter {
  sayHello() {
    return 'hello'
  }
}
```

Let's write a feature file specifying how it should work, in `features/greeting.feature`:

```gherkin
Feature: Greeting

  Scenario: Say hello
    When the greeter says hello
    Then I should have heard "hello"
```

Next, we need to provide automation to turn that spec into tests, in `features/support/steps.js`:

```js
import assert from 'node:assert'
import { When, Then } from '@cucumber/node'
import { Greeter } from '../../lib/Greeter.js'

When('the greeter says hello', (t) => {
  t.world.whatIHeard = new Greeter().sayHello()
});

Then('I should have heard {string}', (t, expectedResponse) => {
  assert.equal(t.world.whatIHeard, expectedResponse)
});
```

Finally, run `node --test` with some special arguments:

```shell
node --import @cucumber/node/bootstrap --test-reporter=dot --test 'features/**/*.feature'
```

## Running tests

Since cucumber-node augments the standard Node.js test runner, you can use many of its options in the same way you would when running tests written in JavaScript, like:

- 🔀 [`--test-concurrency`](https://nodejs.org/api/cli.html#--test-concurrency) to control the number of concurrent processes
- 🏃 [`--test-force-exit`](https://nodejs.org/api/cli.html#--test-force-exit) to forcibly exit once all tests have executed
- 😷 [`--test-isolation=none`](https://nodejs.org/api/cli.html#--test-isolationmode) to have all tests run in a single process
- 🔍 [`--test-name-pattern`](https://nodejs.org/api/cli.html#--test-name-pattern) to target some scenarios by name
- 💎 [`--test-shard`](https://nodejs.org/api/cli.html#--test-shard) to shard execution across multiple runs/environments
- ⏩ [`--test-skip-pattern`](https://nodejs.org/api/cli.html#--test-skip-pattern) to omit some scenarios by name
- 👀 [`--watch`](https://nodejs.org/api/cli.html#--watch) to watch for changes and automatically re-run

(In all cases you still need the `--import @cucumber/node/bootstrap` so that cucumber-node kicks in when a feature file is encountered.)

## Writing steps

Full API documentation is at https://cucumber.github.io/cucumber-node/ and includes:

- `Before` and `After` for hooks
- `Given`, `When` and `Then` for steps
- `ParameterType` for custom parameter types

## Reporters

Some Cucumber formatters are included as Node.js test reporters:

- HTML - `--test-reporter=@cucumber/node/reporters/html --test-reporter-destinaton=./report.html`
- Message - `--test-reporter=@cucumber/node/reporters/message --test-reporter-destinaton=./messages.ndjson`
