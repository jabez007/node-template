const shell = require('shelljs');
const assert = require('assert');

shell.cd('test');

describe('template', function () {
    this.timeout(30 * 1000); // set a higher timeout of these tests
    describe('TypeScript', () => {
        // console.log(process.cwd());
        it('should create a project from the template', () => {
            const result = shell.exec([
                'node ../dist',
                '--templateChoice=typescript',
                '--projectName=test-project',
                '--projectVersion=1.1.1',
                '--projectDescription="a test project"',
                '--projectEntryPoint="test/index.js"',
                '--projectRepository="https://github.com/tester/test-project.git"',
                '--projectKeywords="test project"',
                '--projectAuthor="Tester McTestyson"',
                '--projectLicense=ISC',
            ].join(' '));
            // console.log(result.code);
            assert.ok(result.code === 0);
        });
    });
});