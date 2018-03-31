type CodeReason = {
  readonly type: 'code';
  readonly code: number;
};

type ErrorReason = {
  readonly type: 'error';
  readonly error: Error;
};

type SignalReason = {
  readonly type: 'signal';
  readonly signal: string;
};

type ExitReason = CodeReason | ErrorReason | SignalReason | null;

type Handler = (reason: ExitReason) => void;

type ExitOptions = {
  readonly cleanup: boolean;
  readonly exit: boolean;
};

const mkCode = (code: number): ExitReason => ({ type: 'code', code });
const mkError = (error: Error): ExitReason => ({ type: 'error', error });
const mkSignal = (signal: string): ExitReason => ({ type: 'signal', signal });

let _handlers: Handler[] = [];

const exitHandler = <T>(
  options: ExitOptions | null,
  map: (val: T) => ExitReason,
) => (val: T) => {
  const reason = map(val);
  const handlers = _handlers;
  _handlers = [];
  handlers.forEach(h => {
    try {
      h(reason);
    } catch (e) {
      console.error(`[Exit handler]: ${e.stack || e}`);
    }
  });

  if (reason && reason.type === 'error') {
    console.error(reason.error.stack || reason.error);
  }

  if (options && options.exit) {
    process.exit();
  }
};

const setup = () => {
  // prevent the program from closing instantly
  process.stdin.resume();

  // run handler when app is closing
  process.on('exit', exitHandler({ cleanup: true, exit: false }, mkCode));

  // catches ctrl+c event
  process.on('SIGINT', exitHandler({ cleanup: false, exit: true }, mkSignal));

  // catches "kill pid" (for example: nodemon restart)
  process.on('SIGUSR1', exitHandler({ cleanup: false, exit: true }, mkSignal));
  process.on('SIGUSR2', exitHandler({ cleanup: false, exit: true }, mkSignal));

  //catches uncaught exceptions
  process.on(
    'uncaughtException',
    exitHandler({ cleanup: false, exit: true }, mkError),
  );
};

const beforeExit = (fn: Handler) => {
  if (_handlers.length === 0) {
    setup();
  }

  _handlers.push(fn);
};

export default beforeExit;
