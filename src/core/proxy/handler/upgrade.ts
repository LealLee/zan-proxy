import http from 'http';
import HttpProxy from 'http-proxy';
import { ComposedMiddleware } from 'koa-compose';
import net from 'net';
import { Service } from 'typedi';
import URL from 'url';

import { IProxyContext } from '@core/types/proxy';

@Service()
export class UpgradeHandler {
  private proxyServer: HttpProxy = HttpProxy.createProxyServer({
    secure: false, // http-proxy api  在request的option里设置 rejectUnauthorized = false
  });
  private middleware: ComposedMiddleware<IProxyContext> = () => Promise.resolve(null);

  public setMiddleware(middleware: ComposedMiddleware<IProxyContext>) {
    this.middleware = middleware;
  }

  public async handle(req: http.IncomingMessage, socket: net.Socket, head: Buffer) {
    const ctx = {
      head,
      req,
      res: new http.ServerResponse(req),
      socket,
    } as IProxyContext;
    this.middleware(ctx).then(() => {
      const { hostname, port, protocol } = URL.parse(req.url);
      this.proxyServer.ws(req, socket, head, {
        target: {
          hostname,
          port,
          protocol,
        },
      });
    });
  }
}