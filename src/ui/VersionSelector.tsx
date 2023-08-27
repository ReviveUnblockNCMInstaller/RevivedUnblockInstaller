import { LocalJSONConfig } from "../utils/config";

export const VersionItem = ({ version, isSelected, onSelect }) => {
    const { tag, installed, filename, releaseDate, onlineFileName } = version;

    return (
        <div
            className={`version-item ${installed ? "installed" : ""} ${isSelected ? "selected" : ""
                }`}
            onClick={onSelect}
        >
            <div className="circle">
                <div className="circle-inner"></div>
            </div>
            <div className="info">
                <div className="tag">{tag}</div>
                <div className="details">
                    <span className="filename">{onlineFileName ?? filename}</span>
                    <span className="release-date">{releaseDate}</span>
                </div>
            </div>
        </div>
    );
};

export const VersionSelector = ({ UNMVersions, config, selectedVersionIndex: defaultSelectedVersionIndex }) => {
    const jsonConf: LocalJSONConfig = config;
    const [selectedVersion, setSelectedVersion] = React.useState(defaultSelectedVersionIndex);

    React.useEffect(()=>{
        setSelectedVersion(defaultSelectedVersionIndex);
    },[UNMVersions])

    const handleVersionSelect = (index) => {
        jsonConf.setConfig("selectedVersion", UNMVersions[index]);
        jsonConf.write();
        setSelectedVersion(index);
    };

    return (
        <div className="version-selector">
            {UNMVersions.map((version, index) => (
                <VersionItem
                    key={index}
                    version={version}
                    isSelected={selectedVersion === index}
                    onSelect={() => handleVersionSelect(index)}
                />
            ))}
        </div>
    );
};