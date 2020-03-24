#!/usr/bin / env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const has_yarn_1 = __importDefault(require("has-yarn"));
const newLine = (count = 1) => '\n'.repeat(count);
const logWithSpacing = (message, spacing = 1) => {
    console.log(newLine(spacing), message, newLine(spacing));
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
            return reject(err);
        }
        if (['yarn', 'npm'].includes(command.split(' ')[0])) {
            console.log(`Installed ${command
                .replace('yarn add', '')
                .replace('npm install', '')
                .trim()
                .split(' ')
                .join(', ')} sucessfully`);
        }
        resolve({
            stderr,
            stdout,
        });
        return true;
    });
});
child_process_1.exec(has_yarn_1.default() ? 'yarn' : 'npm install', async () => {
    logWithSpacing('Installing eslint');
    await run(`${pkgInstaller(true)} eslint`);
    logWithSpacing('Installing typescript and typescript parser');
    await run(`${pkgInstaller(true)} -D typescript @typescript-eslint/parser`);
    logWithSpacing('Installing required Next packages');
    await run(`${pkgInstaller()} next react react-dom`);
    logWithSpacing('Installing types for Next packages');
    await run(`${pkgInstaller(true)} @types/next @types/react @types/react-dom @types/node`);
    console.log('\nInstalling Sass support\n');
    await run(`${pkgInstaller(true)} sass`);
    console.log('Don\'t forget to run `npx eslint`');
});
