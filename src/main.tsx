import Notiflix from "notiflix";
import { Config, NotSupported } from "./ui/config";
import { checkAndExecuteUnblock, startUNM } from "./unblock";
import { LocalJSONConfig } from "./utils/config";
import { ProxyConfig, checkConnectibility, checkProxiedConnectibility, getProxyConfig, setProxyConfig } from "./utils/network";

const config = new LocalJSONConfig("./RevivedUnblockInstaller/config.json");

plugin.onLoad(async function () {
    await betterncm.fs.mkdir("./RevivedUnblockInstaller");
    await config.read();


    if (config.getConfig("enabled", false)) {
        Notiflix.Loading.circle("RevivedUnblockInstaller 插件正在初始化...");
        try {
            checkAndExecuteUnblock(config);
        } catch (e) {
            Notiflix.Loading.remove();
        }
    }


    await config.write();
});

plugin.onConfig(function () {
    const element = document.createElement("div");
    const isX64 = navigator.userAgent.includes('WOW64');
    if (isX64)
        ReactDOM.render(<Config stylesheet={betterncm_native.fs.readFileText(this.pluginPath + "/style.css")} config={config} />, element);
    else
        ReactDOM.render(<NotSupported />, element);

    return element;
})