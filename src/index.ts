#!/usr/bin / env node

import { exec } from 'child_process'
import hasYarn from 'has-yarn'

const newLine = (count = 1) => '\n'.repeat(count)

const logWithSpacing = (message: string, spacing = 1) => {
  console.log(
    newLine(spacing),
    message,
    newLine(spacing),
  )
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
      return reject(err)
    }

    if (['yarn', 'npm'].includes(command.split(' ')[0])) {
      console.log(`Installed ${
        command
          .replace('yarn add', '')
          .replace('npm install', '')
          .trim()
          .split(' ')
          .join(', ')
      } successfully`)
    }

    resolve({
      stderr,
      stdout,
    })

    return true
  })
})

exec(hasYarn() ? 'yarn' : 'npm install', async () => {
  logWithSpacing('Installing eslint')
  await run(`${pkgInstaller(true)} eslint`)
  logWithSpacing('Installing typescript and typescript parser')
  await run(`${pkgInstaller(true)} -D typescript @typescript-eslint/parser`)
  logWithSpacing('Installing required Next packages')
  await run(`${pkgInstaller()} next react react-dom`)
  logWithSpacing('Installing types for Next packages')
  await run(`${pkgInstaller(true)} @types/next @types/react @types/react-dom @types/node`)
  console.log('\nInstalling Sass support\n')
  await run(`${pkgInstaller(true)} sass`)

  console.log('Don\'t forget to run `npx eslint`')
})
