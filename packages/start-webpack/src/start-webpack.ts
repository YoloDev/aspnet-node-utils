import fs from 'fs';
import run from './run';
export { default as start } from './start';

if (
  require.main === module &&
  process.argv.length > 2 &&
  process.argv[2] === 'run'
) {
  run().catch(e => {
    console.error(e.stack || e);
    process.exit(1);
  });
}
