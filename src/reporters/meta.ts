import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import detectCiEnvironment from '@cucumber/ci-environment'
import { Meta, version as protocolVersion } from '@cucumber/messages'
import { PackageJson } from 'type-fest'

const { version } = JSON.parse(
  await fs.readFile(path.join(import.meta.dirname, '..', '..', 'package.json'), {
    encoding: 'utf-8',
  })
) as PackageJson

export const meta: Meta = {
  protocolVersion,
  implementation: {
    name: 'cucumber-node',
    version,
  },
  cpu: {
    name: os.arch(),
  },
  os: {
    name: os.platform(),
    version: os.release(),
  },
  runtime: {
    name: 'Node.js',
    version: process.versions.node,
  },
  ci: detectCiEnvironment(process.env),
}
