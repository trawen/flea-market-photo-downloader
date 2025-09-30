const esbuild = require('esbuild')

const ctx = esbuild
  .context({
    entryPoints: ['src/content.js'],
    bundle: true,
    outfile: 'dist/content.js',
    format: 'iife',
    sourcemap: true,
    target: 'es2020',
  })
  .then((ctx) => {
    ctx.watch()
    console.log('👀 Watching for changes...')
  })
