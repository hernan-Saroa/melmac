import { Controller, Get, All, Req, Res, Next } from '@nestjs/common';
import { AppService } from './app.service';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';

const djangoProxy = createProxyMiddleware({
  target: 'http://localhost:8000',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '', // Remove /api prefix before forwarding to Django
  },
  on: {
    proxyReq: fixRequestBody,
  },
});

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/api/nest-hello')
  getHello(): string {
    return this.appService.getHello() + ' from NestJS API Gateway!';
  }

  // Fallback Proxy: Enruta cualquier petición no manejada hacia Django
  @All('*')
  fallback(@Req() req: any, @Res() res: any, @Next() next: any) {
    djangoProxy(req, res, next);
  }
}
