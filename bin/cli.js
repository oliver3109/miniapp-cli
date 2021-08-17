#!/usr/bin/env node

const program = require('commander');
const pkg = require('../package.json');
const chalk = require('chalk');
const initAnalysis = require('./analysis');

program.version(pkg.version, '-v, --version').action(() => {
  console.log(chalk.blue(pkg.version));
});

program
  .command('analysis')
  .alias('a')
  .description(chalk.blue('正在分析小程序'))
  .action(() => initAnalysis());

program.parse(process.argv);
