<h1 align="center">
  <img alt="" width="75" src="https://github.com/cucumber.png"/>
  <br>
  cucumber-node
</h1>
<p align="center">
  <b>Automated tests in plain language, for the Node.js test runner</b>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@cucumber/node" style="text-decoration: none"><img src="https://img.shields.io/npm/v/@cucumber/node?style=flat&color=dark-green" alt="Latest version on npm"></a>
  <a href="https://github.com/cucumber/cucumber-node/actions" style="text-decoration: none"><img src="https://github.com/cucumber/cucumber-node/actions/workflows/test.yaml/badge.svg" alt="Build status"></a>
</p>

[Cucumber](https://github.com/cucumber) is a tool for running automated tests written in plain language. Because they're
written in plain language, they can be read by anyone on your team. Because they can be
read by anyone, you can use them to help improve communication, collaboration and trust on
your team.

⚠️⚠️⚠️  
This is a new implementation of Cucumber built around the [Node.js test runner](https://nodejs.org/api/test.html). It's still in the pre-1.0.0 phase, so APIs and behaviour might change. The stable canonical implementation of Cucumber for JavaScript continues to be [@cucumber/cucumber](https://github.com/cucumber/cucumber-js) for now.  
⚠️⚠️⚠️

## Install

cucumber-node is [available on npm](https://www.npmjs.com/package/@cucumber/node):

```shell
npm install --save-dev @cucumber/node
```

You'll need an LTS or current version of Node.js (currently 22, 24 or 25).

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
})

Then('I should have heard {string}', (t, expectedResponse) => {
  assert.equal(t.world.whatIHeard, expectedResponse)
})
```

Finally, run `node --test` with some special arguments:

```shell
node --enable-source-maps --import @cucumber/node/bootstrap --test "features/**/*.feature"
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

Full API documentation is at https://cucumber.github.io/cucumber-node and includes:

- `Given`, `When` and `Then` for steps
- `Before` and `After` for hooks
- `ParameterType` for custom parameter types
- `DataTable` for working with data tables

### Test context

When you write a step or hook function, the first argument will always be a [`TestCaseContext`](https://cucumber.github.io/cucumber-node/types/TestCaseContext.html) object, similar to the one that `node --test` gives you when writing tests in JavaScript and with many of the same properties, plus the "world" where you can keep your state, and methods for attaching content.

### Finding your code

Discovery of your code is based on the following glob (relative to the working directory):

```
features/**/*.{cjs,js,mjs,cts,mts,ts}
```

This isn't configurable ([yet](https://github.com/cucumber/cucumber-node/issues/10)).

### ESM and CommonJS

cucumber-node is an ESM package, but you can write your code in either format:

- ESM - e.g. `import { Given } from '@cucumber/node'`
- CommonJS - e.g. `const { Given } = require('@cucumber/node')`

### TypeScript

You also can write your code in TypeScript.

We recommend bringing in [`tsx`](https://www.npmjs.com/package/tsx) to handle the transpilation, plus the Node.js types:

```shell
npm install --save-dev tsx @types/node
```

Then, add `tsx` as another import when you run:

```shell
node --enable-source-maps --import @cucumber/node/bootstrap --import tsx --test "features/**/*.feature"
```

Remember to add a [`tsconfig.json`](https://www.typescriptlang.org/tsconfig/) to your project. If you're not sure what you need, [`@tsconfig/node22`](https://www.npmjs.com/package/@tsconfig/node22) is a good place to start.

#### Without dependencies

You might even be able to go without any extra dependencies and instead lean on [Node.js built-in TypeScript support](https://nodejs.org/api/typescript.html), although this is still very new and has several limitations.

## Reporters

Some Cucumber formatters are included as Node.js test reporters:

- HTML `--test-reporter=@cucumber/node/reporters/html --test-reporter-destination=./report.html`
- JUnit `--test-reporter=@cucumber/node/reporters/junit --test-reporter-destination=./TEST-cucumber.xml`
- Message `--test-reporter=@cucumber/node/reporters/message --test-reporter-destination=./messages.ndjson`

## Mixing tests

You can execute Cucumber tests and normal JavaScript tests in the same test run - cucumber-node won't interfere with the other tests.

## Limitations

There are some pretty standard Cucumber features that are missing (but not for long):

- [Filtering by tag expression](https://github.com/cucumber/cucumber-node/issues/9)
- [BeforeAll/AfterAll hooks](https://github.com/cucumber/cucumber-node/issues/8)

## What's different?

Some behaviour of cucumber-node is different - and better - than in cucumber-js:

### Concurrency by default

`node --test` by default runs each test file in a separate process, and runs them concurrently as much as possible within the constraints of the system. This is markedly different to cucumber-js which is single-process and serial by default. This is also a good thing, helping you identify and fix unintentional dependencies between scenarios.

### Arrow functions

There's no reliance on `this` in your step and hook functions to access state, since we pass a context object as the first argument to those functions. This means you're free to use arrow functions as you normally would in JavaScript.


