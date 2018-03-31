import { ChildProcess } from 'child_process';
import beforeExit from '@yolodev/before-exit';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const access = promisify(fs.access);
const readFile = promisify(fs.readFile);
const open = promisify(fs.open);
const close = promisify(fs.close);
const write = promisify(fs.write);
const unlink = promisify(fs.unlink);

type SpawnHandler = () => ChildProcess;
type LiveHandler<T> = (proc: ChildProcess) => Promise<T>;

export interface IPidManager {
  exists(): Promise<boolean>;
  checkRunning(): Promise<boolean>;
  start<T>(fn: SpawnHandler, liveHandler: LiveHandler<T>): Promise<T>;
  maybeStart<T>(
    fn: SpawnHandler,
    liveHandler: LiveHandler<T>,
  ): Promise<T | null>;
  stop(): Promise<void>;
  connect(): void;
}

const workdirPid = (
  name: string,
  workdir: string = process.cwd(),
): IPidManager => {
  const pidFile = path.resolve(workdir, `.${name}.pid`);

  const exists = async () => {
    try {
      await access(pidFile, fs.constants.F_OK);
      return true;
    } catch (e) {
      return false;
    }
  };

  const getRunning = async () => {
    try {
      const { pid, data } = JSON.parse(
        await readFile(pidFile, { encoding: 'utf-8' }),
      );

      // will throw if process is not running
      process.kill(pid, 0);
      return { pid, data };
    } catch (e) {
      try {
        await unlink(pidFile);
      } catch (_) {}

      return null;
    }
  };

  const checkRunning = async () => {
    const pInfo = await getRunning();
    return pInfo !== null;
  };

  const start = async <T>(fn: SpawnHandler, liveHandler: LiveHandler<T>) => {
    if (await checkRunning()) {
      throw new Error(`Already started`);
    }

    let fs: number = 0;
    let threw = true;
    try {
      fs = await open(pidFile, 'wx');
      const p = await fn();
      const result = await liveHandler(p);

      await write(fs, p.pid.toString(), null, 'utf-8');
      p.unref();
      threw = false;
      return result;
    } finally {
      await close(fs);
      if (threw) {
        try {
          await unlink(pidFile);
        } catch (_) {}
      }
    }
  };

  const maybeStart = async <T>(
    fn: SpawnHandler,
    liveHandler: LiveHandler<T>,
  ) => {
    const pInfo = await getRunning();
    if (pInfo !== null) {
      return pInfo.data;
    }

    let fs: number = 0;
    let threw = true;
    try {
      fs = await open(pidFile, 'wx');
      const p = await fn();
      const data = await liveHandler(p);

      await write(
        fs,
        JSON.stringify({
          pid: p.pid,
          data,
        }),
        null,
        'utf-8',
      );
      threw = false;
      p.unref();
      return data;
    } finally {
      await close(fs);
      if (threw) {
        try {
          await unlink(pidFile);
        } catch (_) {}
      }
    }
  };

  const stop = async () => {
    const pInfo = await getRunning();
    if (pInfo) {
      try {
        process.kill(pInfo.pid);
      } catch (_) {}
    }
  };

  const connect = () => {
    beforeExit(() => {
      try {
        fs.unlinkSync(pidFile);
      } catch (_) {}
    });
  };

  return {
    exists,
    checkRunning,
    start,
    maybeStart,
    stop,
    connect,
  };
};

export default workdirPid;
