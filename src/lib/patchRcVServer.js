export function patchRcVServer(sdk) {
  const platform = sdk.platform();
  platform._$originalCreateUrl = platform.createUrl;

  platform.createUrl = function (path, options) {
    if (path.indexOf('/rcvideo') === 0 && this._rcvServer === this._server) {
      if (
        this._rcvServer.indexOf('ringcentral.com') > -1 &&
        this._rcvServer.indexOf('devtest') === -1
      ) {
        // only path production env
        this._rcvServer = 'https://api-meet.ringcentral.com';
      }
    }
    return platform._$originalCreateUrl(path, options);
  }
  return sdk;
}
