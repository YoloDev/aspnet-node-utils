import createConfig from '../../build/make-rollup-config';

export default createConfig({
  location: __dirname,
  main: 'src/start-webpack.ts',
  name: 'start-webpack',
});