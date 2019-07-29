#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var ejs = __importStar(require("ejs"));
var shelljs_1 = __importDefault(require("shelljs"));
var yargs = __importStar(require("yargs"));
var inquirer_1 = __importDefault(require("inquirer"));
var CURR_DIR = process.cwd();
var templatesDir = path_1.default.join(__dirname, 'templates');
// console.log(templatesDir);
var CHOICES = fs_1.default.readdirSync(templatesDir)
    .filter(function (f) { return fs_1.default.lstatSync(path_1.default.join(templatesDir, f)).isDirectory(); });
var QUESTIONS = [
    {
        name: 'templateChoice',
        type: 'list',
        message: 'What project template would you like to generate?',
        choices: CHOICES,
        when: function () { return !yargs.argv['templateChoice']; },
    },
    {
        name: 'projectName',
        type: 'input',
        message: 'project name:',
        validate: function (input) {
            if (/^([A-Za-z\-_\d])+$/.test(input)) {
                return true;
            }
            else {
                return 'Project name may only include letters, numbers, underscores and hashes.';
            }
        },
        when: function () { return !yargs.argv['projectName']; },
    },
    {
        name: 'projectVersion',
        type: 'input',
        message: 'version:',
        default: '1.0.0',
        validate: function (input) {
            if (/^(\d+\.\d+\.\d+(\.\d+){0,1})$/.test(input)) {
                return true;
            }
            else {
                return 'Project version should follow Semantic Versioning.';
            }
        },
        when: function () { return !yargs.argv['projectVersion']; },
    },
    {
        name: 'projectDescription',
        type: 'input',
        message: 'description:',
        when: function () { return !yargs.argv['projectDescription']; },
    },
    {
        name: 'projectEntryPoint',
        type: 'input',
        message: 'entry point:',
        default: 'dist/index.js',
        when: function () { return !yargs.argv['projectEntryPoint']; },
    },
    {
        name: 'projectRepository',
        type: 'input',
        message: 'git repository:',
        when: function () { return !yargs.argv['projectRepository']; },
    },
    {
        name: 'projectKeywords',
        type: 'input',
        message: 'keywords:',
        when: function () { return !yargs.argv['projectKeywords']; },
    },
    {
        name: 'projectAuthor',
        type: 'input',
        message: 'author:',
        when: function () { return !yargs.argv['projectAuthor']; },
    },
    {
        name: 'projectLicense',
        type: 'input',
        message: 'license:',
        default: 'MIT',
        when: function () { return !yargs.argv['projectLicense']; },
    },
];
// console.log(yargs.argv);
// @ts-ignore
inquirer_1.default.prompt(QUESTIONS)
    // @ts-ignore
    .then(function (answers) {
    // Merge command line arguments with user’s answers.
    answers = Object.assign({}, answers, yargs.argv);
    // format answers to fit package.json
    answers.projectKeywords = answers.projectKeywords.split(' '); // could use a delimiter other than space?
    var repoUrl = answers.projectRepository
        .substring(0, answers.projectRepository.lastIndexOf('.'));
    answers.projectBugsUrl = repoUrl + "/issues";
    answers.projectHomepage = repoUrl + "#readme";
    // console.log(answers);
    var templatePath = path_1.default.join(templatesDir, answers.templateChoice);
    // console.log(templatePath);
    var targetPath = path_1.default.join(CURR_DIR, answers.projectName);
    // console.log(targetPath);
    function createDirectoryContents(templatePath, newProjectPath) {
        if (!fs_1.default.existsSync(newProjectPath)) {
            fs_1.default.mkdirSync(newProjectPath);
        }
        fs_1.default.readdirSync(templatePath).forEach(function (file) {
            var origFilePath = path_1.default.join(templatePath, file);
            // console.log(origFilePath);
            // get stats about the current file
            var stats = fs_1.default.statSync(origFilePath);
            if (stats.isFile()) {
                var writePath = path_1.default.join(newProjectPath, file);
                // console.log(writePath);
                var contents = fs_1.default.readFileSync(origFilePath, 'utf8');
                // fill in the project template with user's answers
                fs_1.default.writeFileSync(writePath, ejs.render(contents, answers), 'utf8');
            }
            else if (stats.isDirectory()) {
                createDirectoryContents(path_1.default.join(templatePath, file), path_1.default.join(newProjectPath, file));
            }
        });
    }
    createDirectoryContents(templatePath, targetPath);
    function postProcess(options) {
        var isNode = fs_1.default.existsSync(path_1.default.join(options.templatePath, 'package.json'));
        if (isNode) {
            shelljs_1.default.cd(options.targetPath);
            // install node dependencies after creating new project
            var result = shelljs_1.default.exec('npm install');
            if (result.code !== 0) {
                return false;
            }
        }
        return true;
    }
    postProcess({ templatePath: templatePath, targetPath: targetPath });
});
