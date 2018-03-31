import webpack, { Compiler } from 'webpack';

import express from 'express';
import findUp from 'find-up';
import middleware from 'webpack-dev-middleware';
import workdirPidManager from '@yolodev/workdir-pid';

const env = <T>(name: string, defaultValue: T, map: (val: string) => T) => {
  const envVal = process.env[name];
  if (envVal !== null) {
    try {
      return map(envVal!);
    } catch (_) {}
  }

  return defaultValue;
};

const getPublicPath = (compiler: Compiler) => {
  if (!compiler.options) {
    return null;
  }

  if (!compiler.options.output) {
    return null;
  }

  if (!compiler.options.output.publicPath) {
    return null;
  }

  return compiler.options.output.publicPath;
};

const defaultDevServerConfig = {
  hot: true,
  port: env('PORT', 3000, v => parseInt(v, 10)),
};

const delay = (n: number) => new Promise(resolve => setTimeout(resolve, n));

const run = async () => {
  const mgr = workdirPidManager('webpack');
  mgr.connect();

  const webpackConfPath = await findUp('webpack.config.js');
  if (!webpackConfPath) {
    process.send!({
      error: `No 'webpack.config.js' found relative to '${process.cwd()}'.`,
    });
    await delay(500);
    return;
  }

  try {
    const config = require(webpackConfPath);
    const { devServer = defaultDevServerConfig } = config;
    const compiler = webpack(config);
    const app = express();
    app.use(
      middleware(compiler, {
        ...(config.devServer || {}),
      }),
    );

    const server = app.listen(
      typeof devServer.port === 'number'
        ? devServer.port
        : defaultDevServerConfig.port,
      () => {
        process.send!({
          data: {
            address: server.address,
            path: getPublicPath(compiler),
          },
        });
      },
    );
  } catch (e) {
    process.send!({ error: String(e.stack || e) });
    await delay(500);
    return;
  }
};

export default run;
