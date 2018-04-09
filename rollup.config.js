import makeRollupConfig from './build/make-rollup-config';
import path from 'path';

const pkg = name => {
  const location = path.resolve(__dirname, 'packages', name);
  const main = path.join('src', `${name}.ts`);
  debugger;
  return makeRollupConfig({ location, main, name });
};

export default Promise.all(
  ['before-exit', 'start-webpack', 'workdir-pid'].map(pkg),
);
