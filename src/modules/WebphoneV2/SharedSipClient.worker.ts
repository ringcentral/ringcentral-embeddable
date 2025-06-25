// Run in SharedWorker

import EventEmitter from "ringcentral-web-phone-beta-2/event-emitter";
import RcMessage from "ringcentral-web-phone-beta-2/rc-message/rc-message";
import InboundMessage from "ringcentral-web-phone-beta-2/sip-message/inbound";
import OutboundMessage from "ringcentral-web-phone-beta-2/sip-message/outbound/index";
import RequestMessage from "ringcentral-web-phone-beta-2/sip-message/outbound/request";
import ResponseMessage from "ringcentral-web-phone-beta-2/sip-message/outbound/response";
import type { SipClient, SipClientOptions, SipInfo } from "ringcentral-web-phone-beta-2/types";
import {
  branch,
  fakeDomain,
  fakeEmail,
  generateAuthorization,
  uuid,
} from "ringcentral-web-phone-beta-2/utils";

const maxExpires = 60;

class SharedWorkerSipClient extends EventEmitter implements SipClient {
  public disposed = false;
  public wsc: WebSocket;
  public sipInfo: SipInfo;
  public instanceId: string;
  private debug: boolean;

  private timeoutHandle: NodeJS.Timeout;

  public constructor({
    debug = false,
  }: {
    debug?: boolean;
  } = {}) {
    super();
    this.debug = debug;
  }

  public async start({
    sipInfo,
    instanceId,
    debug = false,
  }: SipClientOptions) {
    this.sipInfo = sipInfo;
    this.instanceId = instanceId ?? sipInfo.authorizationId!;
    this.debug = true;
    if (this.wsc) {
      return;
    }
    await this.connect();
    if (this.timeoutHandle) {
      clearInterval(this.timeoutHandle);
    }
    await this.register(maxExpires);
  }

  private useBackupOutboundProxy = false;
  public toggleBackupOutboundProxy(enabled = true) {
    this.useBackupOutboundProxy = enabled;
  }

  public connect(): Promise<void> {
    this.wsc = new WebSocket(
      "wss://" +
        (this.useBackupOutboundProxy
          ? this.sipInfo.outboundProxyBackup
          : this.sipInfo.outboundProxy),
      "sip",
    );
    if (this.debug) {
      const wscSend = this.wsc.send.bind(this.wsc);
      this.wsc.send = (message) => {
        console.log(`Sending...(${new Date()})\n` + message);
        return wscSend(message);
      };
    }

    this.wsc.addEventListener("message", async (event) => {
      const inboundMessage = InboundMessage.fromString(event.data);
      if (inboundMessage.subject.startsWith("MESSAGE sip:")) {
        const rcMessage = await RcMessage.fromXml(inboundMessage.body);
        if (
          rcMessage.body.Cln &&
          rcMessage.body.Cln !== this.sipInfo.authorizationId
        ) {
          return; // the message is not for this instance
        }
      }
      if (this.debug) {
        console.log(`Receiving...(${new Date()})\n` + event.data);
      }
      this.emit("inboundMessage", inboundMessage);
      if (
        inboundMessage.subject.startsWith("MESSAGE sip:") ||
        inboundMessage.subject.startsWith("BYE sip:") ||
        inboundMessage.subject.startsWith("CANCEL sip:") ||
        inboundMessage.subject.startsWith("INFO sip:") ||
        inboundMessage.subject.startsWith("NOTIFY sip:")
      ) {
        // Auto reply 200 OK to MESSAGE, BYE, CANCEL, INFO, NOTIFY
        await this.reply(
          new ResponseMessage(inboundMessage, { responseCode: 200 }),
        );
      }
    });

    return new Promise<void>((resolve, reject) => {
      const openEventHandler = () => {
        this.wsc.removeEventListener("open", openEventHandler);
        resolve();
      };
      this.wsc.addEventListener("open", openEventHandler);
      const errorEventHandler = (e) => {
        this.wsc.removeEventListener("error", errorEventHandler);
        reject(e);
      };
      this.wsc.addEventListener("error", errorEventHandler);
    });
  }

  public async dispose() {
    this.disposed = true;
    clearInterval(this.timeoutHandle);
    this.removeAllListeners();
    await this.unregister();
    this.wsc.close();
  }

  public async register(expires: number) {
    const requestMessage = new RequestMessage(
      `REGISTER sip:${this.sipInfo.domain} SIP/2.0`,
      {
        "Call-Id": uuid(),
        Contact:
          `<sip:${fakeEmail};transport=wss>;+sip.instance="<urn:uuid:${this.instanceId}>";expires=${expires}`,
        From:
          `<sip:${this.sipInfo.username}@${this.sipInfo.domain}>;tag=${uuid()}`,
        To: `<sip:${this.sipInfo.username}@${this.sipInfo.domain}>`,
        Via: `SIP/2.0/WSS ${fakeDomain};branch=${branch()}`,
      },
    );
    // if cannot get response in 5 seconds, we close the connection
    const closeHandle = setTimeout(() => this.wsc.close(), 5000);
    let inboundMessage = await this.request(requestMessage);
    clearTimeout(closeHandle);
    const wwwAuth = inboundMessage.headers["Www-Authenticate"] ||
      inboundMessage!.headers["WWW-Authenticate"];
    if (wwwAuth) {
      const nonce = wwwAuth.match(/, nonce="(.+?)"/)![1];
      const newMessage = requestMessage.fork();
      newMessage.headers.Authorization = generateAuthorization(
        this.sipInfo,
        nonce,
        "REGISTER",
      );
      inboundMessage = await this.request(newMessage);
    } else if (inboundMessage.subject.startsWith("SIP/2.0 603 ")) {
      throw new Error("Registration failed: " + inboundMessage.subject);
    }
    if (expires > 0) { // not for unregister
      const serverExpires = Number(
        inboundMessage.headers.Contact.match(/;expires=(\d+)/)![1],
      );
      this.timeoutHandle = setTimeout(
        () => {
          this.register(expires);
        },
        (serverExpires - 3) * 1000, // 3 seconds before server expires
      );
    }
  }
  public async unregister() {
    await this.register(0);
  }

  public async request(message: string | RequestMessage): Promise<InboundMessage> {
    return await this._send(message, true);
  }
  public async reply(message: string | ResponseMessage): Promise<void> {
    await this._send(message, false);
  }
  private _send(
    rawMessage: string | OutboundMessage,
    waitForReply = false,
  ): Promise<InboundMessage> {
    let message: OutboundMessage;
    if (typeof rawMessage === 'string') {
      this.wsc.send(rawMessage);
      message = OutboundMessage.fromString(rawMessage);
    } else {
      this.wsc.send(rawMessage.toString());
      message = rawMessage;
    }
    this.emit("outboundMessage", message);
    if (!waitForReply) {
      return new Promise<InboundMessage>((resolve) => {
        resolve(new InboundMessage());
      });
    }
    return new Promise<InboundMessage>((resolve) => {
      const messageListerner = (inboundMessage: InboundMessage) => {
        if (inboundMessage.headers.CSeq !== message.headers.CSeq) {
          return;
        }
        if (inboundMessage.subject.startsWith("SIP/2.0 100 ")) {
          return; // ignore
        }
        this.off("inboundMessage", messageListerner);
        resolve(inboundMessage);
      };
      this.on("inboundMessage", messageListerner);
    });
  }
}

const sipClient = new SharedWorkerSipClient();
let ports = [];

// @ts-ignore
onconnect = (event) => {
  const port = event.ports[0];
  ports.push(port);
  console.log('port connected', port, ports);
  port.onmessage = async(event) => {
    const { type, requestId, request } = event.data;
    if (type === 'destroyPort') {
      ports = ports.filter((p) => p !== port);
      return;
    }
    if (type === 'workerRequest') {
      if (request.type === 'startSipClient') {
        await sipClient.start(request.data);
        port.postMessage({
          type: 'workerResponse',
          requestId,
          response: 'OK',
        });
        return;
      }
      if (request.type === 'request') {
        const response = await sipClient.request(request.data);
        port.postMessage({
          type: 'workerResponse',
          requestId,
          response: response.toString(),
        });
        return;
      }
      if (request.type === 'reply') {
        await sipClient.reply(request.data);
        port.postMessage({
          type: 'workerResponse',
          requestId,
          response: 'OK',
        });
        return;
      }
      if (request.type === 'register') {
        await sipClient.register(request.data);
        port.postMessage({
          type: 'workerResponse',
          requestId,
          response: 'OK',
        });
        return;
      }
      if (request.type === 'toggleBackupOutboundProxy') {
        sipClient.toggleBackupOutboundProxy(request.data);
        port.postMessage({
          type: 'workerResponse',
          requestId,
          response: 'OK',
        });
        return;
      }
      port.postMessage({
        type: 'workerResponse',
        requestId,
        response: 'NOT_SUPPORTED',
      });
    }
  };
};

sipClient.on('inboundMessage', (message) => {
  ports.forEach((port) => {
    port.postMessage({
      type: 'inboundMessage',
      message: message.toString(),
    });
  });
});

sipClient.on('outboundMessage', (message) => {
  ports.forEach((port) => {
    port.postMessage({
      type: 'outboundMessage',
      message: message.toString(),
    });
  });
});