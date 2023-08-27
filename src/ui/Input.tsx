
export const Input = ({ label, placeholder, onChange, defaultValue = "" }) => {
    return (
        <div className="input-container">
            <span className="input-label">{label}</span>
            <input
                className="input-box"
                placeholder={placeholder}
                onChange={onChange}
                defaultValue={defaultValue}
            />
        </div>
    );
};