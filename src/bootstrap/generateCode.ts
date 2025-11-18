import { generate } from '@babel/generator'
import * as t from '@babel/types'

import { CompiledGherkin } from '../runner/index.js'

function createImports() {
  return [
    t.importDeclaration(
      [
        t.importSpecifier(t.identifier('suite'), t.identifier('suite')),
        t.importSpecifier(t.identifier('test'), t.identifier('test')),
      ],
      t.stringLiteral('node:test')
    ),
    t.importDeclaration(
      [t.importSpecifier(t.identifier('prepare'), t.identifier('prepare'))],
      t.stringLiteral('@cucumber/node/runner')
    ),
  ]
}

function createSourceLocation(uri: string): t.SourceLocation {
  return {
    start: { line: 1, column: 0, index: 0 },
    end: { line: 1, column: 0, index: 0 },
    filename: uri,
    identifierName: undefined,
  }
}

function withLoc<T extends t.Node>(node: T, loc: t.SourceLocation): T {
  node.loc = loc
  return node
}

function createTestStepLoop(testCaseVar: string, sourceLocation: t.SourceLocation) {
  return t.forOfStatement(
    t.variableDeclaration('const', [t.variableDeclarator(t.identifier('testStep'))]),
    t.memberExpression(t.identifier(testCaseVar), t.identifier('testSteps')),
    t.blockStatement([
      // await testStep.setup()
      t.expressionStatement(
        t.awaitExpression(
          withLoc(
            t.callExpression(
              t.memberExpression(t.identifier('testStep'), t.identifier('setup')),
              []
            ),
            sourceLocation
          )
        )
      ),
      // await ctx1.test(testStep.name, testStep.options, async (ctx2) => { ... })
      t.expressionStatement(
        t.awaitExpression(
          withLoc(
            t.callExpression(t.memberExpression(t.identifier('ctx1'), t.identifier('test')), [
              t.memberExpression(t.identifier('testStep'), t.identifier('name')),
              t.memberExpression(t.identifier('testStep'), t.identifier('options')),
              t.arrowFunctionExpression(
                [t.identifier('ctx2')],
                t.blockStatement([
                  t.expressionStatement(
                    t.awaitExpression(
                      withLoc(
                        t.callExpression(
                          t.memberExpression(t.identifier('testStep'), t.identifier('execute')),
                          [t.identifier('ctx2')]
                        ),
                        sourceLocation
                      )
                    )
                  ),
                ]),
                true // async
              ),
            ]),
            sourceLocation
          )
        )
      ),
      // await testStep.teardown()
      t.expressionStatement(
        t.awaitExpression(
          withLoc(
            t.callExpression(
              t.memberExpression(t.identifier('testStep'), t.identifier('teardown')),
              []
            ),
            sourceLocation
          )
        )
      ),
    ]),
    true // await
  )
}

function createTestBodyStatements(testCaseVar: string, sourceLocation: t.SourceLocation) {
  return [
    // await testCaseN.setup(ctx1)
    t.expressionStatement(
      t.awaitExpression(
        withLoc(
          t.callExpression(t.memberExpression(t.identifier(testCaseVar), t.identifier('setup')), [
            t.identifier('ctx1'),
          ]),
          sourceLocation
        )
      )
    ),
    // for await (const testStep of testCaseN.testSteps) { ... }
    createTestStepLoop(testCaseVar, sourceLocation),
    // await testCaseN.teardown()
    t.expressionStatement(
      t.awaitExpression(
        withLoc(
          t.callExpression(
            t.memberExpression(t.identifier(testCaseVar), t.identifier('teardown')),
            []
          ),
          sourceLocation
        )
      )
    ),
  ]
}

function createTestCaseStatements(pickleId: string, pickleUri: string, index: number) {
  const testCaseVar = `testCase${index}`
  const sourceLocation = createSourceLocation(pickleUri)

  return [
    // const testCaseN = plan.select(pickleId)
    t.variableDeclaration('const', [
      t.variableDeclarator(
        t.identifier(testCaseVar),
        withLoc(
          t.callExpression(t.memberExpression(t.identifier('plan'), t.identifier('select')), [
            t.stringLiteral(pickleId),
          ]),
          sourceLocation
        )
      ),
    ]),
    // await test(testCaseN.name, async (ctx1) => { ... })
    t.expressionStatement(
      t.awaitExpression(
        withLoc(
          t.callExpression(t.identifier('test'), [
            t.memberExpression(t.identifier(testCaseVar), t.identifier('name')),
            t.arrowFunctionExpression(
              [t.identifier('ctx1')],
              t.blockStatement(createTestBodyStatements(testCaseVar, sourceLocation)),
              true // async
            ),
          ]),
          sourceLocation
        )
      )
    ),
  ]
}

function createSuiteBody(gherkin: CompiledGherkin) {
  return [
    // const plan = await prepare(gherkin)
    t.variableDeclaration('const', [
      t.variableDeclarator(
        t.identifier('plan'),
        t.awaitExpression(t.callExpression(t.identifier('prepare'), [t.valueToNode(gherkin)]))
      ),
    ]),
    // Test cases for each pickle
    ...gherkin.pickles.flatMap((pickle, index) =>
      createTestCaseStatements(pickle.id, pickle.uri, index)
    ),
  ]
}

export function generateCode(gherkin: CompiledGherkin): string {
  const featureName = gherkin.gherkinDocument.feature?.name ?? gherkin.gherkinDocument.uri ?? ''

  const program = t.program([
    ...createImports(),
    // suite(featureName, async () => { ... })
    t.expressionStatement(
      t.callExpression(t.identifier('suite'), [
        t.stringLiteral(featureName),
        t.arrowFunctionExpression(
          [],
          t.blockStatement(createSuiteBody(gherkin)),
          true // async
        ),
      ])
    ),
  ])

  // Generate code from AST with source maps
  const output = generate(
    program,
    {
      retainLines: false,
      compact: false,
      sourceMaps: true,
      sourceFileName: gherkin.source.uri,
    },
    gherkin.source.data
  )

  // Include inline source map for debugging
  const sourceMapComment = `//# sourceMappingURL=data:application/json;base64,${Buffer.from(JSON.stringify(output.map)).toString('base64')}`

  return `${output.code}\n${sourceMapComment}`
}
