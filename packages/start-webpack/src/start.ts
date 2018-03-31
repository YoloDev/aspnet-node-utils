import { ChildProcess, fork } from 'child_process';

import workdirPidManager from '@yolodev/workdir-pid';

const spawnWebpackServer = () => {
  const p = fork(__filename, ['run'], {
    stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
  });
  return p;
};

const readData = <T>(proc: ChildProcess): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      debugger;
      reject(new Error('timed out'));
    }, 15_000);

    proc.once('message', msg => {
      debugger;
      clearTimeout(timeout);
      if (msg.data) {
        resolve(msg);
      } else if (msg.error) {
        reject(new Error(msg.error));
      } else {
        reject(new Error(`Unknown message:\n${JSON.stringify(msg, null, 2)}`));
      }
    });

    proc.once('close', () => {
      debugger;
      clearTimeout(timeout);
      reject(new Error('Process exited too early'));
    });
  }).then(r => {
    proc.disconnect();
    proc.unref();
    return r;
  });

const start = async (args: ReadonlyArray<string>) => {
  const mgr = workdirPidManager('webpack');

  if (args[0] === 'stop') {
    await mgr.stop();
  } else {
    const data = await mgr.maybeStart(spawnWebpackServer, readData);
    console.log(JSON.stringify(data));
  }
};

export default start;
