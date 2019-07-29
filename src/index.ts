#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import * as ejs from 'ejs';
import shell from 'shelljs';
import * as yargs from 'yargs';
import inquirer from 'inquirer';

const CURR_DIR = process.cwd();

const templatesDir = path.join(__dirname, 'templates');
// console.log(templatesDir);
const CHOICES = fs.readdirSync(templatesDir)
    .filter((f): boolean => fs.lstatSync(path.join(templatesDir, f)).isDirectory());

const QUESTIONS = [
    {
        name: 'templateChoice',
        type: 'list',
        message: 'What project template would you like to generate?',
        choices: CHOICES,
        when: (): boolean => !yargs.argv['template'],
    },
    {
        name: 'projectName',
        type: 'input',
        message: 'project name:',
        validate: (input: string): boolean | string => {
            if (/^([A-Za-z\-_\d])+$/.test(input)) {
                return true;
            } else {
                return 'Project name may only include letters, numbers, underscores and hashes.';
            }
        },
        when: (): boolean => !yargs.argv['name'],
    },
    {
        name: 'projectVersion',
        type: 'input',
        message: 'version:',
        default: '1.0.0',
        validate: (input: string): boolean | string => {
            if (/^(\d+\.\d+\.\d+(\.\d+){0,1})$/.test(input)) {
                return true;
            } else {
                return 'Project version should follow Semantic Versioning.';
            } 
        },
        when: (): boolean => !yargs.argv['version'],
    },
    {
        name: 'projectDescription',
        type: 'input',
        message: 'description:',
        when: (): boolean => !yargs.argv['description'],
    },
    {
        name: 'projectEntryPoint',
        type: 'input',
        message: 'entry point:',
        default: 'dist/index.js',
        when: (): boolean => !yargs.argv['entryPoint'],
    },
    {
        name: 'projectRepository',
        type: 'input',
        message: 'git repository:',
        when: (): boolean => !yargs.argv['repository'],
    },
    {
        name: 'projectKeywords',
        type: 'input',
        message: 'keywords:',
        when: (): boolean => !yargs.argv['keywords'],
    },
    {
        name: 'projectAuthor',
        type: 'input',
        message: 'author:',
        when: (): boolean => !yargs.argv['author'],
    },
    {
        name: 'projectLicense',
        type: 'input',
        message: 'license:',
        default: 'MIT',
        when: (): boolean => !yargs.argv['license'],
    },
];

// @ts-ignore
inquirer.prompt(QUESTIONS)
    // @ts-ignore
    .then((answers): void => {
        // Merge command line arguments with user’s answers.
        answers = Object.assign({}, answers, yargs.argv);
        // format answers to fit package.json
        answers.projectKeywords = (answers.projectKeywords as string).split(' '); // could use a delimiter other than space?
        const repoUrl = (answers.projectRepository as string)
            .substring(0, (answers.projectRepository as string).lastIndexOf('.'));
        answers.projectBugsUrl = `${repoUrl}/issues`;
        answers.projectHomepage = `${repoUrl}#readme`;
        // console.log(answers);

        const templatePath = path.join(templatesDir, answers.templateChoice);
        // console.log(templatePath);
        const targetPath = path.join(CURR_DIR, answers.projectName);
        // console.log(targetPath);

        function createDirectoryContents(templatePath: string, newProjectPath: string): void {
            if (!fs.existsSync(newProjectPath)) {
                fs.mkdirSync(newProjectPath);
            }
            
            fs.readdirSync(templatePath).forEach((file): void => {
                const origFilePath = path.join(templatePath, file);
                // console.log(origFilePath);
                // get stats about the current file
                const stats = fs.statSync(origFilePath);
                if (stats.isFile()) {
                    const writePath = path.join(newProjectPath, file);
                    // console.log(writePath);
                    const contents = fs.readFileSync(origFilePath, 'utf8');
                    // fill in the project template with user's answers
                    fs.writeFileSync(writePath, ejs.render(contents, answers), 'utf8');
                } else if (stats.isDirectory()) {
                    createDirectoryContents(
                        path.join(templatePath, file), 
                        path.join(newProjectPath, file),
                    );
                }
            });
        }

        createDirectoryContents(templatePath, targetPath);

        function postProcess(options: {
            templatePath: string; 
            targetPath: string;
        }): boolean {
            const isNode = fs.existsSync(path.join(options.templatePath, 'package.json'));
            if (isNode) {
                shell.cd(options.targetPath);
                // install node dependencies after creating new project
                const result = shell.exec('npm install');
                if (result.code !== 0) {
                    return false;
                }
            }
            return true;
        }

        postProcess({templatePath, targetPath});
    });      
