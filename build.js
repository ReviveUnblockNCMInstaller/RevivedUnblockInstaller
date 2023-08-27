const esbuild = require('esbuild');
const { lessLoader } = require('esbuild-plugin-less');
const isDev = process.argv.includes('--dev');

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
    } else {
        await esbuild.build({
            entryPoints: ['./src/main.tsx', './src/startup_script.ts', './src/style.less'],
            bundle: true,
            minify: true,
            outdir: 'dist',
            target: 'chrome91',
            plugins: [lessLoader()],
        });

        const compress = require('compressing');
        await compress.zip.compressDir('./dist/', './RevivedUnblockNeteaseMusic.plugin', { ignoreBase: true });
    }
})()