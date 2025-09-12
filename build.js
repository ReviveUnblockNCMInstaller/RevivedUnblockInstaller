const esbuild = require('esbuild');
const { lessLoader } = require('esbuild-plugin-less');
const fs = require('fs');
const path = require('path');

const isDev = process.argv.includes('--dev');

const resources = ['manifest.json', 'preview.png'];
const copyFiles = (destDir) => {
    resources.forEach(file => {
        const srcPath = path.resolve(__dirname, 'resources', file);
        const destPath = path.resolve(__dirname, destDir, file);
        fs.copyFileSync(srcPath, destPath);
    });
};

!(async () => {
    if (isDev) {
        await esbuild.build({
            entryPoints: ['./src/main.tsx', './src/startup_script.ts', './src/style.less'],
            bundle: true,
            sourcemap: 'inline',
            target: 'chrome91',
            outdir: '.',
            plugins: [lessLoader()],
        });
        copyFiles('.');
    } else {
        await esbuild.build({
            entryPoints: ['./src/main.tsx', './src/startup_script.ts', './src/style.less'],
            bundle: true,
            minify: true,
            outdir: 'dist',
            target: 'chrome91',
            plugins: [lessLoader()],
        });
        copyFiles('dist');

        const compress = require('compressing');
        await compress.zip.compressDir('./dist/', './RevivedUnblockNeteaseMusic.plugin', { ignoreBase: true });
    }
})()