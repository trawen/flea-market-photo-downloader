const esbuild = require('esbuild')
const copy = require('esbuild-plugin-copy').default

esbuild.build({
  entryPoints: ['src/content.js', 'src/background.js', 'src/popup.js'],
  bundle: true,
  outdir: 'dist',
  format: 'iife',
  plugins: [
    copy({
      assets: [
        { from: 'src/manifest.json', to: 'manifest.json' },
        { from: 'src/popup.html', to: 'popup.html' },
      ],
    }),
  ],
})
