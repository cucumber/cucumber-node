import { exec } from 'node:child_process'
import { copyFile, cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import type { Envelope } from '@cucumber/messages'
import type { Query } from '@cucumber/query'
import * as pty from 'node-pty'

const ESC = String.fromCharCode(0x1b)
const BEL = String.fromCharCode(0x07)
const stripOscRegex = new RegExp(`${ESC}\\][^${BEL}${ESC}]*(?:${BEL}|${ESC}\\\\)`, 'g')

let messageFileSeq = 0

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
    // when collecting envelopes for a query, route the message reporter to a file so the
    // (potentially long) ndjson bypasses the pty entirely and isn't subject to terminal wrapping
    const messageFile = query
      ? path.join(tmpdir(), `cucumber-node-messages-${process.pid}-${++messageFileSeq}.ndjson`)
      : undefined

    const args = [
      '--enable-source-maps',
      '--import',
      '@cucumber/node/bootstrap',
      `--test-reporter=${query ? '@cucumber/node/reporters/message' : reporter}`,
      `--test-reporter-destination=${messageFile ?? 'stdout'}`,
      ...extraArgs,
      '--test',
      '*.test.mjs',
      'features/**/*.feature',
      'features/**/*.feature.md',
    ]

    const [output, error] = await new Promise<readonly [string, unknown]>((resolve) => {
      const ptyProcess = pty.spawn(process.execPath, args, {
        name: process.platform === 'win32' ? '' : 'xterm-256color',
        cols: 80,
        rows: 24,
        cwd: this.tempDir,
        env: process.env as Record<string, string>,
      })

      let captured = ''
      ptyProcess.onData((data: string) => {
        captured += data
      })

      ptyProcess.onExit(({ exitCode }) => {
        const normalized = captured
          .replace(/\r\n/g, '\n')
          // strip OSC sequences (e.g. terminal title) which Windows ConPty emits at startup;
          // Node's stripVTControlCharacters does not handle them correctly
          .replace(stripOscRegex, '')
        resolve([normalized, exitCode !== 0 ? { code: exitCode } : null])
      })
    })

    if (query && messageFile) {
      const ndjson = await readFile(messageFile, 'utf-8')
      await rm(messageFile, { force: true })
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
  await symlink(process.cwd(), path.join(tempDir, 'node_modules', '@cucumber', 'node'))

  return new TestHarness(tempDir)
}
