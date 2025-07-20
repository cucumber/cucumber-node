import { copyFile, cp, mkdir, mkdtemp, symlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { tmpdir } from 'node:os'
import { exec } from 'node:child_process'
import { Query } from '@cucumber/query'
import { Envelope } from '@cucumber/messages'

class TestHarness {
  constructor(private readonly tempDir: string) {}

  async copyDir(source: string, target: string) {
    await cp(source, path.join(this.tempDir, target), {
      recursive: true,
    })
  }

  async copyFile(source: string, target: string) {
    await copyFile(source, path.join(this.tempDir, target))
  }

  async writeFile(target: string, content: string) {
    await writeFile(path.join(this.tempDir, target), content, { encoding: 'utf-8' })
  }

  async run(
    reporter = 'spec',
    ...extraArgs: string[]
  ): Promise<readonly [string, string, unknown]> {
    return new Promise((resolve) => {
      exec(
        [
          'node',
          `--import`,
          `@cucumber/node/bootstrap`,
          `--test-reporter=${reporter}`,
          `--test-reporter-destination=stdout`,
          ...extraArgs,
          `--test`,
          `"*.test.mjs"`,
          `"features/**/*.feature"`,
          `"features/**/*.feature.md"`,
        ].join(' '),
        {
          cwd: this.tempDir,
        },
        (error, stdout, stderr) => {
          resolve([stdout, stderr, error])
        }
      )
    })
  }

  async collectMessages(): Promise<Query> {
    const query = new Query()
    const [output] = await this.run('@cucumber/node/reporters/message')
    output
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line) as Envelope)
      .forEach((envelope) => query.update(envelope))
    return query
  }
}

export async function makeTestHarness() {
  // create temporary directory
  const tempDir = await mkdtemp(path.join(tmpdir(), `cucumber-node-integration-`))

  // symlink @cucumber/node package into node_modules
  await mkdir(path.join(tempDir, 'features'))
  await mkdir(path.join(tempDir, 'node_modules'))
  await mkdir(path.join(tempDir, 'node_modules', '@cucumber'))
  await symlink(process.cwd(), path.join(tempDir, 'node_modules', '@cucumber', 'node'))

  return new TestHarness(tempDir)
}
