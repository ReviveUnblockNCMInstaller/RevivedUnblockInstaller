export const RoundedRectButton = ({ defaultValue, onChange, children }) => {
    const [enabled, setEnabled] = React.useState(defaultValue);

    const handleClick = () => {
        setEnabled(!enabled);
        onChange && onChange(!enabled);
    };

    const buttonClass = `rr-btn_button rr-btn_${enabled ? "enabled" : "disabled"
        }`;

    return (
        <div className="rr-btn_container">
            <button className={buttonClass} onClick={handleClick}>
                {enabled ? "已启用" : "已禁用"}
            </button>
            {enabled && children}
        </div>
    );
};
