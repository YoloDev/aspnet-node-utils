import createConfig from '../../build/make-rollup-config';

export default createConfig({
  location: __dirname,
  main: 'src/before-exit.ts',
  name: 'before-exit',
});
