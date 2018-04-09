import autoExternal from 'rollup-plugin-auto-external';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import typescript from 'rollup-plugin-typescript2';

const readFile = promisify(fs.readFile);

export default async ({ location, main, name }) => {
  const pkg = JSON.parse(
    await readFile(path.resolve(location, 'package.json'), {
      encoding: 'utf-8',
    }),
  );

  return {
    input: path.resolve(location, main),
    output: [
      { format: 'cjs', file: path.resolve(location, 'dist', `${name}.js`) },
      { format: 'es', file: path.resolve(location, 'dist', `${name}.mjs`) },
    ],
    plugins: [
      autoExternal({
        builtins: true,
        dependencies: true,
        packagePath: location,
        peerDependencies: true,
      }),
      typescript({
        tsconfigOverride: {
          compilerOptions: {
            rootDir: path.resolve(location, 'src'),
          },
          include: [path.resolve(location, 'src')],
        },
      }),
    ],
  };
};
