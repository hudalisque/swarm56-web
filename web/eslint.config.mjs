const nextCoreWebVitals = (await import("eslint-config-next/core-web-vitals"))
  .default;
const nextTypeScript = (await import("eslint-config-next/typescript")).default;

const config = [...nextCoreWebVitals, ...nextTypeScript];

export default config;
