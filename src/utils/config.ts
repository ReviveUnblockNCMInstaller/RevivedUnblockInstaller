export class LocalJSONConfig extends EventTarget {
    private data: any;
    constructor(private path: string) { super(); }

    async read() {
        try {
            this.data = JSON.parse(await betterncm.fs.readFileText(this.path));
        } catch (e) {
            this.data = {};
        }
    }

    readSync() {
        try {
            this.data = JSON.parse(betterncm_native.fs.readFileText(this.path));
        } catch (e) {
            this.data = {};
        }
    }

    async write(){
        await betterncm.fs.writeFileText(this.path, JSON.stringify(this.data));
    }

    getConfig<T>(key:string, defaultValue: T){  
        if(this.data[key] === undefined)
            this.data[key] = defaultValue;
        return this.data[key];
    }

    setConfig<T>(key:string, value: T){
        this.data[key] = value;
        this.dispatchEvent(new CustomEvent("change"))
    }
}
