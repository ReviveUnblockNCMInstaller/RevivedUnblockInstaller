import Notiflix from "notiflix";
import { ProxyConfig, getProxyConfig, setProxyConfig, checkProxiedConnectibility, checkConnectibility, fetchUrlAsBlob } from "./utils/network";
import { LocalJSONConfig } from "./utils/config";

interface UNMEnvironmentVariables {
    ENABLE_FLAC?: boolean;
    ENABLE_LOCAL_VIP?: boolean;
    ENABLE_HTTPDNS?: boolean;
    BLOCK_ADS?: boolean;
    DISABLE_UPGRADE_CHECK?: boolean;
    DEVELOPMENT?: boolean;
    FOLLOW_SOURCE_ORDER?: boolean;
    JSON_LOG?: boolean;
    NO_CACHE?: boolean;
    MIN_BR?: number;
    SELECT_MAX_BR?: boolean;
    LOG_LEVEL?: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
    LOG_FILE?: string;
    JOOX_COOKIE?: string;
    MIGU_COOKIE?: string;
    QQ_COOKIE?: string;
    YOUTUBE_KEY?: string;
    SIGN_CERT?: string;
    SIGN_KEY?: string;
    SEARCH_ALBUM?: boolean;
}

const generateEnvironmentVariablesCommandLine = (env: UNMEnvironmentVariables) => {
    let command = '';
    for (const [key, value] of Object.entries(env)) {
        if (value) {
            command += `set ${key}=${value} && `;
        }
    }
    return command.slice(0, -4);
}

interface UNMArguments {
    version?: boolean,
    port?: string,
    address?: string,
    proxyUrl?: string,
    forceHost?: string,
    matchOrder?: string[],
    token?: string,
    endpoint?: string,
    strict?: boolean,
    cnrelay?: string,
    help?: boolean
}

function generateCommandLine(args: UNMArguments): string {
    let cmd = "";
    if (args.version) cmd += " -v";
    if (args.port) cmd += ` -p ${args.port}`;
    if (args.address) cmd += ` -a ${args.address}`;
    if (args.proxyUrl) cmd += ` -u ${args.proxyUrl}`;
    if (args.forceHost) cmd += ` -f ${args.forceHost}`;
    if (args.matchOrder) cmd += ` -o ${args.matchOrder.join(" ")}`;
    if (args.token) cmd += ` -t ${args.token}`;
    if (args.endpoint) cmd += ` -e ${args.endpoint}`;
    if (args.strict) cmd += " -s";
    if (args.cnrelay) cmd += ` -c ${args.cnrelay}`;
    if (args.help) cmd += " -h";
    return cmd;
}

export const startUNM = async (binaryPath: string, port: number, env: UNMEnvironmentVariables, visible: boolean = false, args: UNMArguments) => {
    args["port"] = `${port}:${port + 1}`;
    const command = `cmd /c ${generateEnvironmentVariablesCommandLine(env)} && ${await betterncm.app.getDataPath()}${binaryPath} ${generateCommandLine(args)}`;
    console.log("Launching UNM: ", command, {
        visible,
        binaryPath,
        port,
        env,
        args
    });
    betterncm.app.exec(command, false, visible);
}

export async function installAndLaunchUnblock(port: number, config: LocalJSONConfig) {
    const selectedVersion = config.getConfig("selectedVersion", null);
    if (!selectedVersion) {
        Notiflix.Notify.failure("[Revived UnblockMusic] 未选中 UnblockNeteaseMusic 版本，请先安装");
        throw Error("Failed to start UnblockNeteaseMusic: No version selected");
        return;
    }
    const binaryPath = `./RevivedUnblockInstaller/${selectedVersion.filename}`;
    if (betterncm_native.fs.exists(binaryPath)) {
        const order = config.getConfig("source-order", SourcesPreset);

        startUNM(binaryPath, port, {
            ENABLE_LOCAL_VIP: false,
            BLOCK_ADS: false,
            QQ_COOKIE: config.getConfig("qq-cookie", ""),
            YOUTUBE_KEY: config.getConfig("youtube-key", ""),
            MIGU_COOKIE: config.getConfig("migu-cookie", ""),
            JOOX_COOKIE: config.getConfig("joox-cookie", ""),
        }, config.getConfig("visible", false), {
            proxyUrl: config.getConfig("upstream-proxy", ""),
            matchOrder: order.filter(v => v.enable).map(v => v.code),
        });
    } else {
        if (selectedVersion.installed) {
            Notiflix.Notify.failure("[Revived UnblockMusic] 未找到 UnblockNeteaseMusic 二进制文件，请重新选择版本并安装");
            throw Error("Failed to start UnblockNeteaseMusic: Binary not found");
        }
        else {
            Notiflix.Loading.remove();
            return new Promise<void>(async (resolve, reject) => {
                const proxyConf = await getProxyConfig();
                if (proxyConf.Type !== "none") {
                    Notiflix.Loading.dots("未找到 UnblockNeteaseMusic 二进制文件，即将重启网易云音乐...");
                    await betterncm.utils.delay(1000);
                    await applyProxyConfig({ Type: "none" });
                } else {
                    const connectibility = await checkConnectibility();

                    if (connectibility) {
                        Notiflix.Confirm.show(
                            "Revived UnblockMusic",
                            "你选中的版本 Unblock 版本未安装，是否下载并安装？",
                            "下载并安装",
                            "忽略",
                            async () => {
                                Notiflix.Loading.circle(`正在下载 UnblockCloudMusic ${selectedVersion.tag} (0%)`, { messageMaxLength: 99999 });
                                const downloadResult = await fetchUrlAsBlob(selectedVersion.download_url, event => {
                                    document.querySelector<HTMLDivElement>('.nx-loading-message').innerText = `正在下载 UnblockCloudMusic ${selectedVersion.tag} (${((event.loaded / event.total) * 100).toFixed(2)}% ${(event.loaded / 1024 / 1024).toFixed(2)}M/${(event.total / 1024 / 1024).toFixed(2)}M)`;
                                });
                                Notiflix.Loading.change(`正在安装 UnblockCloudMusic ${selectedVersion.tag}`);
                                await betterncm.fs.writeFile(`./${binaryPath}`, downloadResult);
                                await installAndLaunchUnblock(port, config);
                                resolve();
                            }
                        )
                    } else {
                        Notiflix.Notify.failure("[Revived UnblockMusic] 未连接网络");
                        reject(Error("Failed to start UnblockNeteaseMusic: No network connection"));
                    }
                }
            })
        }
    }
}

export async function applyProxyConfig(expectedConfig: ProxyConfig, enableCertBypass = expectedConfig.Type === "http") {
    if (enableCertBypass)
        await betterncm.app.writeConfig("cc.microblock.betterncm.ignore-certificate-errors", "true");

    const currentConfig = await getProxyConfig();
    if (currentConfig.Type != expectedConfig.Type || currentConfig?.http?.Host != expectedConfig?.http?.Host
        || currentConfig?.http?.Port != expectedConfig?.http?.Port) {
        if (expectedConfig.http && typeof expectedConfig.http.Port === "number") expectedConfig.http.Port = (expectedConfig.http.Port as any).toString();
        await setProxyConfig(expectedConfig);
        await betterncm.utils.delay(300);

        async function restartNCM() {
            await betterncm.app.exec(`cmd /c ping 127.0.0.1 -n 2 && start """""""" """"%cd%\\cloudmusic.exe""""`, false, false);
            channel.call("app.exit", () => { }, ["restart"]);
        }
        await restartNCM();
    }
}

export async function checkAndExecuteUnblock(config: LocalJSONConfig) {
    config.setConfig("enabled", true);
    await config.write();

    const port = config.getConfig("port", Math.round(Math.random() * 10000 + 10000));
    Notiflix.Loading.remove();
    Notiflix.Loading.circle("正在检查 UnblockMusic 服务是否已启动...");
    const proxyConf = {
        Type: "http",
        http: {
            Host: "localhost",
            Port: port
        }
    } as const;

    await betterncm.utils.delay(100);
    const proxyedConnectibility = await checkProxiedConnectibility(proxyConf);

    if (proxyedConnectibility) {
        await applyProxyConfig(proxyConf);
        Notiflix.Loading.remove();
        Notiflix.Notify.success("UnblockMusic 服务已启动", { pauseOnHover: false, position: "left-top", timeout: 1000 });
        return;
    } else {
        await betterncm.utils.delay(100);
        const withoutProxyConnectibility = await checkConnectibility();
        if (!withoutProxyConnectibility) {
            Notiflix.Loading.remove();
            Notiflix.Notify.failure("[Revived UnblockMusic] 未连接网络");
            throw Error("Failed to start UnblockNeteaseMusic: No network connection");
            return;
        }

        Notiflix.Loading.change("正在启动 UnblockMusic 服务...");
        await installAndLaunchUnblock(port, config);
        if (await checkProxiedConnectibility(proxyConf)) {
            Notiflix.Loading.change("正在检查代理设置...");
            await applyProxyConfig(proxyConf);
            Notiflix.Loading.remove();
            Notiflix.Notify.success("UnblockMusic 服务已启动", { pauseOnHover: false, position: "left-top", timeout: 1000 });
        } else {
            Notiflix.Loading.remove();
            Notiflix.Confirm.show('Revived UnblockMusic', '启动 UnblockMusic 服务失败，是否禁用？', '禁用', '取消', async () => {
                await applyProxyConfig({ Type: "none" });
                config.setConfig("enabled", false);
                await config.write();
            }, () => { });
        }
    }
}

export const stopUNMProcesses = async () =>
    await betterncm.app.exec(`taskkill /f /fi """"IMAGENAME eq UnblockNeteaseMusic-*""""`);


export const SourcesPreset = [
    {
        "name": "QQ 音乐",
        "code": "qq",
        "enable": true,
        "note": "需要准备自己的 QQ_COOKIE（请参阅下方〈环境变量〉处）。必须使用 QQ 登录。"
    },
    {
        "name": "酷狗音乐",
        "code": "kugou",
        "enable": true
    },
    {
        "name": "酷我音乐",
        "code": "kuwo",
        "enable": true
    },
    {
        "name": "咪咕音乐",
        "code": "migu",
        "enable": true,
        "note": "需要准备自己的 MIGU_COOKIE（请参阅下方〈环境变量〉处）。"
    },
    {
        "name": "JOOX",
        "code": "joox",
        "enable": false,
        "note": "需要准备自己的 JOOX_COOKIE（请参阅下方〈环境变量〉处）。似乎有严格地区限制。"
    },
    {
        "name": "YouTube（纯 JS 解析方式）",
        "code": "youtube",
        "enable": false,
        "note": "需要 Google 认定的非中国大陆区域 IP 地址。"
    },
    {
        "name": "yt-download",
        "code": "ytdownload",
        "enable": false,
        "note": "似乎不能使用。"
    },
    {
        "name": "YouTube（通过 youtube-dl）",
        "code": "youtubedl",
        "enable": true,
        "note": "需要自行安装 youtube-dl。"
    },
    {
        "name": "YouTube（通过 yt-dlp）",
        "code": "ytdlp",
        "enable": true,
        "note": "需要自行安装 yt-dlp（youtube-dl 仍在活跃维护的 fork）。"
    },
    {
        "name": "B 站音乐",
        "code": "bilibili",
        "enable": true
    },
    {
        "name": "第三方网易云 API",
        "code": "pyncmd",
        "enable": false
    }
];