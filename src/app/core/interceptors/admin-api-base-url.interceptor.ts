import { HttpInterceptorFn } from '@angular/common/http';

const API_BASE_URLS: Record<'prod' | 'dev', string> = {
  prod: 'https://api.yumdude.com',
  dev: 'https://api.dev.yumdude.com',
};

export const adminApiBaseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api/')) {
    return next(req);
  }

  const storedEnv = localStorage.getItem('yd_env');
  const env = storedEnv === 'dev' ? 'dev' : 'prod';
  const apiReq = req.clone({ url: `${API_BASE_URLS[env]}${req.url}` });

  return next(apiReq);
};
