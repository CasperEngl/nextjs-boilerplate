#!/usr/bin / env node

import { exec } from 'child_process'
import hasYarn from 'has-yarn'
import { stripIndent } from 'common-tags'
import {
  readFile,
  writeFile,
  pathExists,
  ensureDir,
} from 'fs-extra'

const log = (message: string, suffix = '...'): void => {
  process.stdout.write(`${message.trim()}${suffix}`)
}

type Object = {
  [key: string]: any
}

const getKeyIfExists = (object: Object, key: string, value: string) => {
  if (object[key]) {
    return object[key]
  }

  return value
}

type LogStatus = 'SUCCESS' | 'ERROR'

const logStatus = (status: LogStatus) => {
  switch (status) {
    case 'SUCCESS':
      process.stdout.write(' ✅\n')
      break
    case 'ERROR':
      process.stdout.write(' 🚫\n')
      break

    default:
      process.stdout.write(' Status Unknown ❓\n')
  }
}

const run = (command: string) => new Promise((resolve, reject) => {
  exec(command, (err, stdout, stderr) => {
    if (err) {
      logStatus('ERROR')
      return reject(err)
    }

    logStatus('SUCCESS')

    resolve({
      stderr,
      stdout,
    })

    return true
  })
})

const pkgInstaller = (dev = false): string => {
  if (hasYarn()) {
    return dev ? 'yarn add -D' : 'yarn add'
  }

  return dev ? 'npm install --save-dev' : 'npm install'
}

const pkgInit = async (): Promise<void> => {
  if (!await pathExists(`${process.cwd()}/package.json`)) {
    if (hasYarn()) {
      await run('yarn init -y')
    } else {
      await run('npm init -y')
    }
  }
}

const createDirectories = async (): Promise<void> => {
  await ensureDir('pages')
  await ensureDir('components')
  await ensureDir('layout')
  await ensureDir('public')
  await ensureDir('style')
}

const installScripts = async (): Promise<void> => {
  const pkgPath = `${process.cwd()}/package.json`

  const pkgString = (await readFile(pkgPath)).toString()
  const pkgJson = JSON.parse(pkgString)

  if (!pkgJson.scripts) {
    pkgJson.scripts = {}
  }

  pkgJson.scripts.dev = getKeyIfExists(pkgJson.scripts, 'dev', 'next')
  pkgJson.scripts.build = getKeyIfExists(pkgJson.scripts, 'build', 'next build')
  pkgJson.scripts.start = getKeyIfExists(pkgJson.scripts, 'start', 'next start')

  await writeFile(pkgPath, JSON.stringify(pkgJson, null, 2))
}

const tsconfigInfo = (): void => {
  console.log('Add the following to your `tsconfig.json` inside `compilerOptions`')
  console.log(stripIndent`
    "baseUrl": ".",
    "paths": {
      "@/components/*": ["components/*"],
      "@/layout/*": ["layout/*"],
      "@/public/*": ["public/*"],
      "@/style/*": ["style/*"]
    }
  `)
}

const createNextConfig = async (): Promise<void> => {
  if (!await pathExists('test-next-config.js')) {
    await writeFile('test-next.config.js', `${stripIndent`
      /* eslint-disable no-param-reassign */

      const path = require('path')

      module.exports = {
        webpack: (config) => {
          config.resolve.extensions.push('.ts', '.tsx')
          config.resolve.alias['@'] = path.resolve(__dirname)

          return config
        },
      }
    `}\n`)
  }
}

const runCommands = (): void => {
  console.log('Run these commands manually: \n')
  console.log('npx eslint')
  console.log('npx tsc --init')
}

exec(hasYarn() ? 'yarn' : 'npm install', async () => {
  await pkgInit()
  await installScripts()
  await createDirectories()
  await tsconfigInfo()
  await createNextConfig()

  log('Installing eslint')
  await run(`${pkgInstaller(true)} eslint`)

  log('Installing typescript and typescript parser')
  await run(`${pkgInstaller(true)} typescript @typescript-eslint/parser`)

  log('Installing required Next packages')
  await run(`${pkgInstaller()} next react react-dom`)

  log('Installing types for Next packages')
  await run(`${pkgInstaller(true)} @types/next @types/react @types/react-dom @types/node`)

  log('Installing Sass support')
  await run(`${pkgInstaller(true)} sass`)

  console.log('')

  await runCommands()
})
