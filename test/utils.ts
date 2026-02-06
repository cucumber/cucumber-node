import { copyFile, cp, mkdir, mkdtemp, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { Envelope } from '@cucumber/messages'
import { Query } from '@cucumber/query'
import * as pty from 'node-pty'

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
    reporter: string | Query = 'spec',
    ...extraArgs: string[]
  ): Promise<readonly [string, unknown]> {
    const query = typeof reporter === 'object' ? reporter : undefined

    return new Promise((resolve) => {
      const args = [
        '--enable-source-maps',
        '--import',
        '@cucumber/node/bootstrap',
        `--test-reporter=${query ? '@cucumber/node/reporters/message' : reporter}`,
        '--test-reporter-destination=stdout',
        ...extraArgs,
        '--test',
        '*.test.mjs',
        'features/**/*.feature',
        'features/**/*.feature.md',
      ]

      const ptyProcess = pty.spawn(process.execPath, args, {
        name: process.platform === 'win32' ? '' : 'xterm-256color',
        cols: 80,
        rows: 24,
        cwd: this.tempDir,
        env: process.env as Record<string, string>,
      })

      let output = ''
      ptyProcess.onData((data: string) => {
        output += data
      })

      ptyProcess.onExit(({ exitCode }) => {
        const normalizedOutput = output.replace(/\r\n/g, '\n')
        if (query) {
          normalizedOutput
            .trim()
            .split('\n')
            .filter((line) => line.trim().startsWith('{'))
            .map((line) => JSON.parse(line) as Envelope)
            .forEach((envelope) => query.update(envelope))
        }
        const error = exitCode !== 0 ? { code: exitCode } : null
        resolve([normalizedOutput, error])
      })
    })
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
