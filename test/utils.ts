import { exec, spawn } from 'node:child_process'
import { copyFile, cp, mkdir, mkdtemp, readFile, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import type { Envelope } from '@cucumber/messages'
import type { Query } from '@cucumber/query'

class TestHarness {
  constructor(private readonly tempDir: string) {}

  // use a file to capture messages as ndjson, avoiding stdout gotchas on windows
  private get messagesFile() {
    return path.join(this.tempDir, 'output', `messages.ndjson`)
  }

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

  async execFile(file: string): Promise<readonly [string, string, unknown]> {
    return new Promise((resolve) => {
      exec(
        ['node', `--enable-source-maps`, file].join(' '),
        {
          cwd: this.tempDir,
        },
        (error, stdout, stderr) => {
          resolve([stdout, stderr, error])
        }
      )
    })
  }

  async run(
    reporter: string | Query = 'spec',
    ...extraArgs: string[]
  ): Promise<readonly [string, unknown]> {
    const query = typeof reporter === 'object' ? reporter : undefined

    const args = [
      '--enable-source-maps',
      '--import',
      '@cucumber/node/bootstrap',
      `--test-reporter=${query ? '@cucumber/node/reporters/message' : reporter}`,
      `--test-reporter-destination=${query ? this.messagesFile : 'stdout'}`,
      ...extraArgs,
      '--test',
      '*.test.mjs',
      'features/**/*.feature',
      'features/**/*.feature.md',
    ]

    const [output, error] = await new Promise<readonly [string, unknown]>((resolve) => {
      const child = spawn(process.execPath, args, {
        cwd: this.tempDir,
        // FORCE_COLOR ensures we get ANSI escapes on formatter output
        env: { ...process.env, FORCE_COLOR: '1' },
      })

      let captured = ''
      child.stdout.on('data', (chunk) => {
        captured += chunk.toString()
      })
      child.stderr.on('data', (chunk) => {
        captured += chunk.toString()
      })

      child.on('close', (code) => {
        resolve([captured, code !== 0 ? { code } : null])
      })
    })

    if (query) {
      const ndjson = await readFile(this.messagesFile, 'utf-8')
      for (const line of ndjson.split('\n')) {
        if (line.trim().startsWith('{')) {
          query.update(JSON.parse(line) as Envelope)
        }
      }
    }

    return [output, error]
  }
}

export async function makeTestHarness() {
  // create temporary directory
  const tempDir = await mkdtemp(path.join(tmpdir(), `cucumber-node-integration-`))

  // symlink @cucumber/node package into node_modules
  await mkdir(path.join(tempDir, 'features'))
  await mkdir(path.join(tempDir, 'node_modules'))
  await mkdir(path.join(tempDir, 'node_modules', '@cucumber'))
  await mkdir(path.join(tempDir, 'output'))
  await symlink(process.cwd(), path.join(tempDir, 'node_modules', '@cucumber', 'node'))

  return new TestHarness(tempDir)
}
