import { copyFile, cp, mkdir, mkdtemp, symlink } from 'node:fs/promises'
import path from 'node:path'
import { tmpdir } from 'node:os'
import { exec } from 'node:child_process'

class TestHarness {
  constructor(private readonly tempDir: string) {
  }

  async copyDir(source: string, target: string) {
    await cp(source, path.join(
        this.tempDir,
        target
      ), {
        recursive: true,
      },
    )
  }

  async copyFile(source: string, target: string) {
    await copyFile(source, path.join(
      this.tempDir,
      target
    ))
  }

  async run(reporter = 'spec', ...extraArgs: string[]): Promise<readonly [string, string, unknown]> {
    return new Promise((resolve) => {
      exec([
        'node',
        `--import`,
        `@cucumber/node/bootstrap`,
        `--test-reporter=${reporter}`,
        `--test-reporter-destination=stdout`,
        `--test-reporter=spec`,
        `--test-reporter-destination=stderr`,
        ...extraArgs,
        `--test`,
        `'features/**/*.feature'`,
        `'features/**/*.feature.md'`,
      ].join(' '), {
        cwd: this.tempDir,
      }, (error, stdout, stderr) => {
        resolve([stdout, stderr, error])
      })
    })
  }
}

export async function makeTestHarness(prefix: string) {
  // create temporary directory
  const tempDir = await mkdtemp(path.join(tmpdir(), `cucumber-node-${prefix}-`))

  // symlink @cucumber/node package into node_modules
  await mkdir(path.join(tempDir, 'features'))
  await mkdir(path.join(tempDir, 'node_modules'))
  await mkdir(path.join(tempDir, 'node_modules', '@cucumber'))
  await symlink(
    process.cwd(),
    path.join(
      tempDir,
      'node_modules',
      '@cucumber',
      'node',
    ),
  )

  return new TestHarness(tempDir)
}