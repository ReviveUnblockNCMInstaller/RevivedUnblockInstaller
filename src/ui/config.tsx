import Notiflix from "notiflix";
import { SourcesPreset, OtherSettings, applyProxyConfig, checkAndExecuteUnblock, stopUNMProcesses } from "../unblock";
import { LocalJSONConfig } from "../utils/config"
import { RoundedRectButton } from "./RoundRectBtn";
import { VersionSelector } from "./VersionSelector";
import { readUrlFile } from "../utils/network";
import { Input } from "./Input"
import { BadgeList } from "./Badge";

function SourceOrderList({ config }: { config: LocalJSONConfig }) {
    const order = config.getConfig("source-order", SourcesPreset);
    const [badges, setBadges] = React.useState(order);
    const [enableBadges, setEnableBadges] = React.useState(badges.filter(v => v.enable));

    const saveConfig = () => {
        const oldBadges = config.getConfig("source-order", SourcesPreset);
        const newBadges = [...enableBadges];
        oldBadges.forEach((oldBadge) => {
            const newBadge = newBadges.find((v) => v.code === oldBadge.code);
            if (!newBadge) {
                newBadges.push(oldBadge);
            }
        });

        setBadges(newBadges);

        config.setConfig("source-order", newBadges);
        config.write();
    }

    const upItem = (code) => {
        const index = enableBadges.findIndex(v => v.code === code);
        if (index === 0) return;
        const newBadges = [...enableBadges];
        [newBadges[index], newBadges[index - 1]] = [
            newBadges[index - 1],
            newBadges[index]
        ];
        setEnableBadges(newBadges);
        saveConfig();
    }

    const downItem = (code) => {
        const index = enableBadges.findIndex(v => v.code === code);
        if (index === enableBadges.length - 1) return;
        const newBadges = [...enableBadges];
        [newBadges[index], newBadges[index + 1]] = [
            newBadges[index + 1],
            newBadges[index]
        ];
        setEnableBadges(newBadges);
        saveConfig();
    }

    return (
        <div className="updown-list">
            {enableBadges.map((item, index) => {
                return (
                    <div
                        className="updown"
                        key={item.code}
                    >
                        {item.name}
                        <div
                            className="updown-btns"
                        >
                            <div
                                className="updown-btn"
                                onClick={() => upItem(item.code)}
                            >
                                {index === 0 ? '\u00A0' : '↑'}
                            </div>
                            <div
                                className="updown-btn"
                                onClick={() => downItem(item.code)}
                            >
                                {index === enableBadges.length - 1 ? '\u00A0' : '↓'}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function OtherSetting({ config }: { config: LocalJSONConfig }) {
    const settings = config.getConfig("other-settings", OtherSettings);
    const [badges, setBadges] = React.useState(settings);

    const handleBadgeClick = (index) => {
        const newBadges = [...badges];
        newBadges[index].enable = !newBadges[index].enable;
        setBadges(newBadges);

        config.setConfig("other-settings", newBadges);
        config.write()
    };

    const handleBadgeSwap = (index1, index2) => {
        setBadges((prev) => {
            const newBadges = [...prev];
            [newBadges[index1], newBadges[index2]] = [
                newBadges[index2],
                newBadges[index1]
            ];

            config.setConfig("other-settings", newBadges);
            config.write()

            return newBadges;
        });
    };

    return <BadgeList
        badges={badges}
        onBadgeClick={handleBadgeClick}
        onBadgeSwap={handleBadgeSwap}
    />
}

function SourceOrder({ config }: { config: LocalJSONConfig }) {
    const order = config.getConfig("source-order", SourcesPreset);
    const [badges, setBadges] = React.useState(order);

    const handleBadgeClick = (index) => {
        const newBadges = [...badges];
        newBadges[index].enable = !newBadges[index].enable;
        setBadges(newBadges);

        config.setConfig("source-order", newBadges);
        config.write()
    };

    const handleBadgeSwap = (index1, index2) => {
        setBadges((prev) => {
            const newBadges = [...prev];
            [newBadges[index1], newBadges[index2]] = [
                newBadges[index2],
                newBadges[index1]
            ];

            config.setConfig("source-order", newBadges);
            config.write()

            return newBadges;
        });
    };

    return <BadgeList
        badges={badges}
        onBadgeClick={handleBadgeClick}
        onBadgeSwap={handleBadgeSwap}
    />
}

export function Config({ config, stylesheet }: { config: LocalJSONConfig, stylesheet: string }) {
    const [configRefresher, setRefresher] = React.useState(0);

    const [installedVersions, setInstalledVersions] = React.useState([]);
    const [onlineVersions, setOnlineVersions] = React.useState([]);

    React.useEffect(() => {
        !(async () => {

            const files = await betterncm.fs.readDir("./RevivedUnblockInstaller/");
            const versions = files.map(v => v.split(/\/|\\/g).pop()).filter((file) => {
                return file.startsWith("UnblockNeteaseMusic-") && file.endsWith(".exe");
            }).map((file) => {
                return file.replace("UnblockNeteaseMusic-", "").replace(".exe", "");
            });
            setInstalledVersions(versions);
            const latestVersion = await fetch("https://api.github.com/repos/UnblockNeteaseMusic/server/releases/latest")
                .then(v => v.json());

            const asset = latestVersion.assets.find(asset => asset.name.includes("win-x64"));

            setOnlineVersions([{
                tag: latestVersion.tag_name,
                installed: versions.includes(latestVersion.tag_name),
                filename: `UnblockNeteaseMusic-${latestVersion.tag_name}.exe`,
                onlineFileName: asset.name,
                releaseDate: asset.created_at,
                download_url: asset.browser_download_url
            }, {
                tag: latestVersion.tag_name + "-ghproxy",
                installed: versions.includes(latestVersion.tag_name + "-ghproxy"),
                filename: `UnblockNeteaseMusic-${latestVersion.tag_name}-ghproxy.exe`,
                onlineFileName: asset.name,
                releaseDate: asset.created_at,
                download_url: "https://ghproxy.com/" + asset.browser_download_url
            }]);
        })()
    }, []);

    React.useEffect(() => {
        const handleChange = () => {
            setRefresher(prev => prev + 1);
        };
        config.addEventListener('change', handleChange);
        return () => config.removeEventListener('change', handleChange);
    }, [config]);

    const switchWindowShow = async () => {
        const visible = config.getConfig("visible", false);
        config.setConfig("visible", !visible);
        await config.write();
        await stopUNMProcesses();
        await checkAndExecuteUnblock(config);
    };

    const onApplyVersion = async () => {
        const selectedVersion = config.getConfig("selectedVersion", null);
        if (!selectedVersion) {
            Notiflix.Notify.info("请先选中一个版本");
            return;
        }
        await stopUNMProcesses();

        await checkAndExecuteUnblock(config);
    }

    const versions = React.useMemo(() => onlineVersions.concat(installedVersions.map(v => ({
        tag: v,
        installed: true,
        filename: `UnblockNeteaseMusic-${v}.exe`,
        releaseDate: "未知"
    }))), [onlineVersions, installedVersions]);
    const selectedVersionIndex = React.useMemo(() => versions.findIndex(v => v.tag === config.getConfig("selectedVersion", null)?.tag), [
        versions, configRefresher
    ]);

    const onPluginStatusChange = async (enabled: boolean) => {
        config.setConfig("enabled", enabled);
        await config.write();
        if (enabled) {
            await checkAndExecuteUnblock(config);
        } else {
            await stopUNMProcesses();
            await applyProxyConfig({ Type: "none" });
        }
    }

    return (
        <div className="unm">
            <div className="title">
                UnblockCloudMusic
                <div className="revived">Revived</div>
            </div>

            <RoundedRectButton defaultValue={config.getConfig("enabled", false)} onChange={onPluginStatusChange}>
                <div className="optionBlock versionSel">
                    <div className="optionTitle">下载</div>
                    <div className="optionSubtitle">版本选择</div>
                    <VersionSelector
                        UNMVersions={versions}
                        selectedVersionIndex={selectedVersionIndex}
                        config={config}
                    />
                    <button className="btn" onClick={() => onApplyVersion()}>应用</button>
                </div>

                <div className="optionBlock">
                    <div className="optionTitle">运行</div>
                    <div className="optionSubtitle">配置</div>
                    <Input label="上游代理" placeholder="无（如：http://127.0.0.1:7890/）" onChange={e => {
                        config.setConfig("upstream-proxy", e.target.value);
                        config.write();
                    }} defaultValue={config.getConfig("upstream-proxy", "")} />

                    <span className="label">音源设置</span>
                    <div style={{ padding: "15px" }}>
                        <SourceOrder config={config} />
                        {
                            <Input label="网易云音乐 Cookies" placeholder="网易云VIP账号的 MUSIC_U (MUSIC_U=xxxxxx)。" onChange={e => {
                                config.setConfig("netease-cookie", e.target.value);
                                config.write();
                            }} defaultValue={config.getConfig("netease-cookie", "")} />
                        }
                        {
                            config.getConfig("source-order", SourcesPreset).find(v => v.code === "qq" && v.enable) && (
                                <Input label="QQ音乐 Cookies" placeholder="QQ 音源的 uin 和 qm_keyst Cookie。必须使用 QQ 登录。" onChange={e => {
                                    config.setConfig("qq-cookie", e.target.value);
                                    config.write();
                                }} defaultValue={config.getConfig("qq-cookie", "")} />
                            )
                        }
                        {
                            config.getConfig("source-order", SourcesPreset).find(v => v.code === "joox" && v.enable) && (
                                <Input label="JOOX Cookies" placeholder="JOOX 音源的 wmid 和 session_key Cookie。" onChange={e => {
                                    config.setConfig("joox-cookie", e.target.value);
                                    config.write();
                                }} defaultValue={config.getConfig("joox-cookie", "")} />
                            )
                        }
                        {
                            config.getConfig("source-order", SourcesPreset).find(v => v.code === "migu" && v.enable) && (
                                <Input label="咪咕音乐 Cookies" placeholder="咪咕音源的 aversionid Cookie。" onChange={e => {
                                    config.setConfig("migu-cookie", e.target.value);
                                    config.write();
                                }} defaultValue={config.getConfig("migu-cookie", "")} />
                            )
                        }
                        {
                            config.getConfig("source-order", SourcesPreset).find(v => v.code === "youtube" && v.enable) && (
                                <Input label="Youtube Key" placeholder="Youtube 音源的 Data API v3 Key。" onChange={e => {
                                    config.setConfig("youtube-key", e.target.value);
                                    config.write();
                                }} defaultValue={config.getConfig("youtube-key", "")} />
                            )
                        }
                    </div>
                    <span className="label">其他设置</span>
                    <div style={{ padding: "15px" }}>
                        <OtherSetting config={config} />
                    </div>
                    <span className="label">音源顺序</span>
                    <div style={{ padding: "15px" }}>
                        <SourceOrderList config={config} />
                    </div>
                    <div className="note">注：你需要重启进程后配置才能生效</div>
                    <div className="optionSubtitle">当前端口</div>
                    <div style={{ padding: "10px", fontSize: "20px" }}>{config.getConfig("port", Math.round(Math.random() * 10000 + 10000))}</div>
                    <div className="optionSubtitle">操作</div>
                    <button style={{ margin: "10px 5px" }} className="btn" onClick={() => switchWindowShow()}>切换窗口显隐</button>
                    <button style={{ margin: "10px 5px" }} className="btn" onClick={async () => {
                        await stopUNMProcesses();
                        await checkAndExecuteUnblock(config);
                    }}>重新启动进程</button>
                </div>

                <div className="optionBlock">
                    <div className="optionTitle">其他</div>
                    <div className="optionSubtitle">关于</div>
                    <div style={{ padding: "10px", fontSize: "17px" }}>
                        本插件资源仅供学习交流，严禁用于商业用途。<br />
                        歌曲版权归原作者所有，如有侵权请联系删除。<br />
                        本插件仅为安装器，不提供任何音乐资源。<br />
                        不建议进行大型宣发，传播。
                    </div>
                    <div className="optionSubtitle">点点 Star ⭐</div>
                    <button style={{ margin: "10px 5px" }} className="btn" onClick={() => betterncm.ncm.openUrl('https://github.com/UnblockNeteaseMusic/server')}>解灰源项目</button>
                    <button style={{ margin: "10px 5px" }} className="btn" onClick={() => betterncm.ncm.openUrl('https://github.com/ReviveUnblockNCMInstaller/RevivedUnblockInstaller')}>一键安装器（本项目）</button>
                </div>
            </RoundedRectButton>
            <style>
                {stylesheet}
            </style>
        </div>
    );
}

export function NotSupported() {
    return (
        <div>
            <h1>UnblockInstaller 仅支持 x64 系统</h1>
        </div>
    )
}
