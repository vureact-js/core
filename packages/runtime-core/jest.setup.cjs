const { TextDecoder, TextEncoder } = require('util');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// 简单的 Request 实现
global.Request = class {
  constructor(url, init = {}) {
    this.url = url;
    this.method = init.method || 'GET';
    this.headers = init.headers || {};
  }
};

// 简单的 Response 实现
global.Response = class {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.ok = this.status >= 200 && this.status < 300;
    this.headers = init.headers || {};
  }

  static json(data, init) {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
  }
};

// 简单的 fetch 实现
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: async () => ({}),
  text: async () => '',
});
