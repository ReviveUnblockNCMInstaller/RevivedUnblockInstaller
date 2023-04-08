export function checkConnectibility() {
  return checkProxiedConnectibility({ Type: "none" });
}

export function checkProxiedConnectibility(config: ProxyConfig): Promise<boolean> {
  return new Promise(resolve => {
    channel.registerCall('app.ontestproxy', (_, result: number) => resolve(result === 0));
    legacyNativeCmder.call('app.testProxy', 0, config.Type,
      config.http ? config.http.Host + ":" + config.http.Port : "", "", "", "https://music.163.com/")
  })
}

export interface ProxyConfig {
  Type: "http" | "socks5" | "none";
  http?: {
    Host: string;
    Port: string;
  };
  socks5?: {
    Host: string;
    Port: string;
    Username?: string;
    Password?: string;
  };
}

export function setProxyConfig(config: ProxyConfig) {
  return new Promise<void>(resolve => {
    channel.call("app.setLocalConfig", () => resolve(), ["Proxy", "", JSON.stringify(config)])
  })
}

export function getProxyConfig(): Promise<ProxyConfig> {
  return new Promise(resolve => {
    channel.call("app.getLocalConfig", (conf) => resolve(JSON.parse(conf || "{}")), ["Proxy", ""]);
  })
}

export function fetchUrlAsBlob(url: string, onProgress?: (progressEvent: ProgressEvent<EventTarget>) => void): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'blob';

    if (onProgress) {
      xhr.addEventListener('progress', onProgress);
    }

    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve(xhr.response);
      } else {
        reject(xhr.statusText);
      }
    };

    xhr.onerror = () => reject(xhr.statusText);

    xhr.send();
  });
}

export async function readUrlFile(url: string, n: number): Promise<string[]> {
  const response = await fetch(url);
  const reader = response.body?.getReader();
  const lines: string[] = [];
  let lineNumber = 0;
  let done = false;

  while (!done && lineNumber < n) {
    const result = await reader?.read();
    if (result?.value) {
      const textDecoder = new TextDecoder();
      const chunk = textDecoder.decode(result.value);
      let startIndex = 0;
      let endIndex = chunk.indexOf('\n');
      while (endIndex !== -1 && lineNumber < n) {
        lines.push(chunk.substring(startIndex, endIndex));
        lineNumber++;
        startIndex = endIndex + 1;
        endIndex = chunk.indexOf('\n', startIndex);
      }
    } else {
      done = true;
    }
  }

  return lines;
}
