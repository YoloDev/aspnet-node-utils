import createConfig from '../../build/make-rollup-config';

export default createConfig({
  location: __dirname,
  main: 'src/workdir-pid.ts',
  name: 'workdir-pid',
});
