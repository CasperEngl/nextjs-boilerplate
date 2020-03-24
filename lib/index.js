#!/usr/bin / env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const has_yarn_1 = __importDefault(require("has-yarn"));
const fs_extra_1 = require("fs-extra");
const log = (message, suffix = '...') => {
    process.stdout.write(`${message.trim()}${suffix}`);
};
const logStatus = (status) => {
    switch (status) {
        case 'SUCCESS':
            process.stdout.write(' ✅\n');
            break;
        case 'ERROR':
            process.stdout.write(' 🚫\n');
            break;
        default:
            process.stdout.write(' Status Unknown ❓\n');
    }
};
const pkgInstaller = (dev = false) => {
    if (has_yarn_1.default()) {
        return dev ? 'yarn add -D' : 'yarn add';
    }
    return dev ? 'npm install --save-dev' : 'npm install';
};
const run = (command) => new Promise((resolve, reject) => {
    child_process_1.exec(command, (err, stdout, stderr) => {
        if (err) {
            logStatus('ERROR');
            return reject(err);
        }
        logStatus('SUCCESS');
        resolve({
            stderr,
            stdout,
        });
        return true;
    });
});
child_process_1.exec(has_yarn_1.default() ? 'yarn' : 'npm install', async () => {
    await fs_extra_1.ensureDir('components');
    await fs_extra_1.ensureDir('layout');
    await fs_extra_1.ensureDir('public');
    await fs_extra_1.ensureDir('style');
    const pkgPath = `${process.cwd()}/package.json`;
    const pkgString = (await fs_extra_1.readFile(pkgPath)).toString();
    const pkgJson = JSON.parse(pkgString);
    pkgJson.scripts = {
        dev: 'next',
        build: 'next build',
        start: 'next start',
    };
    await fs_extra_1.writeFile(pkgPath, JSON.stringify(pkgJson, null, 2));
    console.log('Add the following to your `tsconfig.json` inside `compilerOptions`');
    console.log(`"baseUrl": ".",
"paths": {
  "@/components/*": ["components/*"],
  "@/layout/*": ["layout/*"],
  "@/public/*": ["public/*"],
  "@/style/*": ["style/*"]
}`);
    log('Installing eslint');
    await run(`${pkgInstaller(true)} eslint`);
    log('Installing typescript and typescript parser');
    await run(`${pkgInstaller(true)} typescript @typescript-eslint/parser`);
    log('Installing required Next packages');
    await run(`${pkgInstaller()} next react react-dom`);
    log('Installing types for Next packages');
    await run(`${pkgInstaller(true)} @types/next @types/react @types/react-dom @types/node`);
    log('Installing Sass support');
    await run(`${pkgInstaller(true)} sass`);
    if (!await fs_extra_1.pathExists('test-next-config.js')) {
        await fs_extra_1.writeFile('test-next.config.js', `/* eslint-disable no-param-reassign */

const path = require('path')

module.exports = {
  webpack: (config) => {
    config.resolve.extensions.push('.ts', '.tsx')
    config.resolve.alias['@'] = path.resolve(__dirname)

    return config
  },
}
`);
    }
    console.log('');
    log('Don\'t forget to run `npx eslint`', '');
});
