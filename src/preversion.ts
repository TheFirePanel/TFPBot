import { readFileSync, writeFileSync } from 'node:fs';

const filePath = './src/index.ts';
const fileContents = readFileSync(filePath, 'utf8');

const updatedContents = fileContents.replace(/process\.env\.version\s*=\s*'*(\d+\.\d+\.\d+)'*/g, () => {
    return `process.env.version = '${process.env.npm_new_version}'`;
});

writeFileSync(filePath, updatedContents);

console.log(`Updated value in index.ts to version ${process.env.npm_new_version}`);