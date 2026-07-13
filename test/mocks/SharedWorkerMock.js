class SharedWorkerPortMock {
  constructor(state) {
    this.state = state;
    this.listeners = new Set();
    this.closed = false;
    this.started = false;
    this.postMessage = jest.fn((message) => this.handleMessage(message));
  }

  addEventListener(event, listener) {
    if (event === 'message') {
      this.listeners.add(listener);
    }
  }

  removeEventListener(event, listener) {
    if (event === 'message') {
      this.listeners.delete(listener);
    }
  }

  start() {
    this.started = true;
  }

  close() {
    this.closed = true;
  }

  dispatch(data) {
    this.listeners.forEach((listener) => listener({ data }));
  }

  respond(requestId, response, error) {
    Promise.resolve().then(() => {
      this.dispatch({
        type: 'workerResponse',
        requestId,
        response,
        error,
      });
    });
  }

  handleMessage(message) {
    this.state.messages.push(message);
    if (!message || message.type !== 'workerRequest') {
      this.handleNotification(message);
      return;
    }
    const { request, requestId } = message;
    this.state.requests.push(request);
    this.respond(requestId, this.handleRequest(request));
  }

  handleNotification(message) {
    if (message.type === 'setSharedState') {
      this.state.sharedState = {
        ...this.state.sharedState,
        ...message.state,
      };
      return;
    }
    if (message.type === 'setActive') {
      this.state.activeTabId = message.activeTabId;
      return;
    }
    if (message.type === 'destroyPort') {
      this.closed = true;
    }
  }

  handleRequest(request) {
    if (request.type === 'getSharedState') {
      return this.state.sharedState;
    }
    if (request.type === 'getActiveTabId') {
      return this.state.activeTabId;
    }
    if (request.type === 'getSipClientStatus') {
      return this.getStatus();
    }
    if (request.type === 'startSipClient') {
      this.state.status = 'registered';
      this.state.sipInfo = request.data.sipInfo;
      this.state.device = request.data.device;
      this.state.instanceId = request.data.instanceId;
      return {};
    }
    if (request.type === 'register') {
      this.state.status = 'registered';
      return {};
    }
    if (request.type === 'unregister') {
      this.state.status = 'unregistered';
      return {};
    }
    return {};
  }

  getStatus() {
    return {
      status: this.state.status,
      sipInfo: this.state.sipInfo,
      device: this.state.device,
      instanceId: this.state.instanceId,
    };
  }
}

export function installSharedWorkerMock() {
  const originalGlobalSharedWorker = global.SharedWorker;
  const originalWindowSharedWorker = window.SharedWorker;
  const controller = {
    workers: [],
    get latestWorker() {
      return this.workers[this.workers.length - 1];
    },
    restore() {
      if (originalGlobalSharedWorker) {
        global.SharedWorker = originalGlobalSharedWorker;
      } else {
        delete global.SharedWorker;
      }
      if (originalWindowSharedWorker) {
        window.SharedWorker = originalWindowSharedWorker;
      } else {
        delete window.SharedWorker;
      }
    },
  };

  class SharedWorkerMock {
    constructor(url, options) {
      this.url = url;
      this.options = options;
      this.state = {
        status: 'init',
        sipInfo: null,
        device: null,
        instanceId: null,
        activeTabId: null,
        sharedState: {},
        messages: [],
        requests: [],
      };
      this.port = new SharedWorkerPortMock(this.state);
      controller.workers.push(this);
    }
  }

  global.SharedWorker = SharedWorkerMock;
  window.SharedWorker = SharedWorkerMock;
  return controller;
}
