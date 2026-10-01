// Compile-checks one or more source files (and everything they import)
// without writing anything:  node scripts/check.mjs src/components/phone/Phone.jsx
// Exit code 1 if any file fails to bundle.
import { build } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const files = process.argv.slice(2);
if (!files.length) {
  console.error('usage: node scripts/check.mjs <file> [file...]');
  process.exit(2);
}

for (const file of files) {
  try {
    await build({
      configFile: false,
      logLevel: 'error',
      plugins: [react(), tailwindcss()],
      build: {
        write: false,
        minify: false,
        modulePreload: false,
        reportCompressedSize: false,
        rollupOptions: { input: file },
      },
    });
    console.log(`OK   ${file}`);
  } catch (err) {
    console.error(`FAIL ${file}\n${err.message}`);
    process.exitCode = 1;
  }
}
