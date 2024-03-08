import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { downloadTarBall } from '../utils/serverInstaller';
import { execSync } from 'child_process';
import * as vscode from 'vscode';
// import * as myExtension from '../../extension';

suite('Extension Test Suite', () => {


    test("Tar extraction", (done) => {
        const url = "http://vscode.download.prss.microsoft.com/dbazure/download/stable/903b1e9d8990623e3d7da1df3d33db3e42d80eda/vscode-server-linux-x64.tar.gz";
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "vscode-flatpak-"));
        downloadTarBall(url, tempDir).then(() => {
            const files = fs.readdirSync(tempDir);
            assert.ok(files.length > 0);
            fs.rmdirSync(tempDir, { recursive: true });
            done();
        });
    }).timeout(10000000);
});
