import {realpathSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vite';

// Use one canonical root when the project is reached through a Windows junction.
export default defineConfig({root:realpathSync(fileURLToPath(new URL('.',import.meta.url)))});
