import path from 'node:path'

import { generate } from '@babel/generator'
import * as t from '@babel/types'
import { Pickle } from '@cucumber/messages'

import { CompiledGherkin } from '../runner/index.js'

export function generateCode(gherkin: CompiledGherkin): string {
  const program = t.program([...createImports(), createSuite(gherkin)])

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

  const sourceMapComment = `//# sourceMappingURL=data:application/json;base64,${Buffer.from(JSON.stringify(output.map)).toString('base64')}`

  return `${output.code}\n${sourceMapComment}`
}

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

function createSuite(gherkin: CompiledGherkin) {
  const suiteName = gherkin.gherkinDocument.feature?.name || gherkin.gherkinDocument.uri
  return t.expressionStatement(
    // suite(suiteName, async () => { ... })
    t.callExpression(t.identifier('suite'), [
      t.valueToNode(suiteName),
      t.arrowFunctionExpression(
        [],
        t.blockStatement([
          // const plan = await prepare(gherkin)
          t.variableDeclaration('const', [
            t.variableDeclarator(
              t.identifier('plan'),
              t.awaitExpression(t.callExpression(t.identifier('prepare'), [t.valueToNode(gherkin)]))
            ),
          ]),
          ...gherkin.pickles.flatMap((pickle, index) => createTestCase(pickle, index)),
        ]),
        true
      ),
    ])
  )
}

function createTestCase(pickle: Pickle, index: number) {
  const testCaseVar = `testCase${index}`
  const location = createPickleLocation(pickle)

  return [
    // const testCaseN = plan.select(pickleId)
    t.variableDeclaration('const', [
      t.variableDeclarator(
        t.identifier(testCaseVar),
        withLoc(
          t.callExpression(t.memberExpression(t.identifier('plan'), t.identifier('select')), [
            t.stringLiteral(pickle.id),
          ]),
          location
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
              t.blockStatement([
                // await testCaseN.setup(ctx1)
                t.expressionStatement(
                  t.awaitExpression(
                    withLoc(
                      t.callExpression(
                        t.memberExpression(t.identifier(testCaseVar), t.identifier('setup')),
                        [t.identifier('ctx1')]
                      ),
                      location
                    )
                  )
                ),
                // for await (const testStep of testCaseN.testSteps) { ... }
                t.forOfStatement(
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
                          location
                        )
                      )
                    ),
                    // await ctx1.test(testStep.name, testStep.options, async (ctx2) => { ... })
                    t.expressionStatement(
                      t.awaitExpression(
                        withLoc(
                          t.callExpression(
                            t.memberExpression(t.identifier('ctx1'), t.identifier('test')),
                            [
                              t.memberExpression(t.identifier('testStep'), t.identifier('name')),
                              t.memberExpression(t.identifier('testStep'), t.identifier('options')),
                              t.arrowFunctionExpression(
                                [t.identifier('ctx2')],
                                t.blockStatement([
                                  // await testStep.execute(ctx2)
                                  t.expressionStatement(
                                    t.awaitExpression(
                                      withLoc(
                                        t.callExpression(
                                          t.memberExpression(
                                            t.identifier('testStep'),
                                            t.identifier('execute')
                                          ),
                                          [t.identifier('ctx2')]
                                        ),
                                        location
                                      )
                                    )
                                  ),
                                ]),
                                true
                              ),
                            ]
                          ),
                          location
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
                          location
                        )
                      )
                    ),
                  ]),
                  true
                ),
                // await testCaseN.teardown()
                t.expressionStatement(
                  t.awaitExpression(
                    withLoc(
                      t.callExpression(
                        t.memberExpression(t.identifier(testCaseVar), t.identifier('teardown')),
                        []
                      ),
                      location
                    )
                  )
                ),
              ]),
              true
            ),
          ]),
          location
        )
      )
    ),
  ]
}

function createPickleLocation(pickle: Pickle): t.SourceLocation {
  return {
    start: { line: 1, column: 0, index: 0 },
    end: { line: 1, column: 0, index: 0 },
    filename: path.basename(pickle.uri),
    identifierName: undefined,
  }
}

function withLoc<T extends t.Node>(node: T, loc: t.SourceLocation): T {
  node.loc = loc
  return node
}
