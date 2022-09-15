#! /usr/bin/env node

import { Command } from "commander"
import { build } from "./commands/build.js"

const program = new Command()

program
    .command('build')
    .description('Transforms all targeted figma-token (json) files into css/scss output files. All options are in a config file some options can be embedded in figma-token files noted by the (e) in the option. Option priority is embed, cmd line, cfg in that order.References {sometoken} are replaced with var(sometoken), can be changed in cfg file but not recommended')
    .option('-c | -cfg <value>', 'Quoted "" full path of alternate config file. Default "figma2Tokens.cfg" ')
    .option('-g | -glob <value>', 'Alternate search glob. Default  "**/*.json"')
    .option('-d | -dry', 'List but do not process token files')
    .option('-i | -in <value>', 'Quoted "" full path ending in / where token files are read. Default is "./tokens/"')
    .option('-o | -out <value>', 'Quoted "" full path ending in / where outputs are placed. Default is "./css/"')
    .option('-m | -mark <value>', '(e) Quoted "" comment used as a header file comment, do not add * //, default is "figma2Token generated file from sourcefile" ')
    .option('-b | -block <value>', '(e) Quoted "" block statement, use F to skip using a block. Default is ":root"')
    .option('-p | -pfx <value>', '(e) Prefix for each token -- or $. Default is "--"')
    .option('-s | -sep <value>', '(e) Sepertor between collaped key names. Default is "-"')
    .option('-x | -ext <value>', '(e) String that will be used as file extention. Default is css, do not add .')
    .action(build);

program.version("0.0.1");
program.parse();

const options = program.opts();

