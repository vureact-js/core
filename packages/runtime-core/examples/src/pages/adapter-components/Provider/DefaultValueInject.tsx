import { useInject } from '../../../../../src';

interface Config {
  apiEndpoint: string;
  retries: number;
}

const OrphanChild = () => {
  // 因为上层没有 Provider name="app-config"，这里会自动使用第二个参数作为默认值
  const config = useInject<Config>('app-config', {
    apiEndpoint: 'https://fallback.api.com',
    retries: 3,
  });

  return (
    <div className="info-box">
      <p>API 地址: {config.apiEndpoint}</p>
      <p>重试次数: {config.retries}</p>
    </div>
  );
};

export const DefaultValueInject = () => {
  return (
    <div className="g-example-container">
      <h3>2. 默认值注入 (Fallback)</h3>
      <p>上层没有 Provider，组件使用默认配置安全渲染：</p>
      <OrphanChild />
    </div>
  );
};
