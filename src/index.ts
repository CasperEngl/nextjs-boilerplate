#!/usr/bin / env node

import { exec } from 'child_process'
import hasYarn from 'has-yarn'
import {
  // readFile,
  writeFile,
  pathExists,
  ensureDir,
} from 'fs-extra'

const log = (message: string, suffix = '...'): void => {
  process.stdout.write(`${message.trim()}${suffix}`)
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

const pkgInstaller = (dev = false) => {
  if (hasYarn()) {
    return dev ? 'yarn add -D' : 'yarn add'
  }

  return dev ? 'npm install --save-dev' : 'npm install'
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

exec(hasYarn() ? 'yarn' : 'npm install', async () => {
  await ensureDir('components')
  await ensureDir('layout')
  await ensureDir('public')
  await ensureDir('style')

  /*   const pkgPath = `${process.cwd()}/package.json`

  const pkgString = (await readFile(pkgPath)).toString()
  const pkgJson = JSON.parse(pkgString)

  pkgJson.scripts = {
    dev: 'next',
    build: 'next build',
    start: 'next start',
  }

  await writeFile(pkgPath, JSON.stringify(pkgJson, null, 2)) */

  console.log('Add the following to your `tsconfig.json`')
  console.log(`"compilerOptions": {
  "baseUrl": ".",
  "paths": {
    "@/components/*": ["components/*"],
    "@/layout/*": ["layout/*"],
    "@/public/*": ["public/*"],
    "@/style/*": ["style/*"]
  }
}`)

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

  if (!await pathExists('test-next-config.js')) {
    await writeFile('test-next.config.js', `
      /* eslint-disable no-param-reassign */

      const path = require('path')

      module.exports = {
        webpack: (config) => {
          config.resolve.extensions.push('.ts', '.tsx')
          config.resolve.alias['@'] = path.resolve(__dirname)

          return config
        },
      }
    `)
  }

  console.log('')

  log('Don\'t forget to run `npx eslint`', '')
})
