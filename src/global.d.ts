import "./types/ncm"
import "../js-framework/index"

declare global {
    var betterncm: typeof import("betterncm-api/index");
    var dom: typeof import("betterncm-api/utils").utils.dom;
    var betterncm_native: any;
    var plugin: import("plugin").NCMInjectPlugin;
    var React: typeof import("react");
    var ReactDOM: typeof import("react-dom");
}
