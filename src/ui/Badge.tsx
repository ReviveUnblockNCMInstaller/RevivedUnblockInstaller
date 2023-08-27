
export function Badge({ text, enable, onClick }) {
  return (
      <div
          className={`badge ${enable ? "badge-enabled" : "badge-disabled"}`}
          onClick={onClick}
          draggable="true"
      >
          <div className="badge-text">{text}</div>
      </div>
  );
}

export function BadgeList({ badges, onBadgeClick, onBadgeSwap }) {
  const handleDragStart = (event, index) => {
      event.dataTransfer.setData("text/plain", index);
  };

  const handleDragOver = (event) => {
      event.preventDefault();
  };

  const handleDrop = (event, dropIndex) => {
      const dragIndex = parseInt(event.dataTransfer.getData("text"));
      onBadgeSwap(dragIndex, dropIndex);
  };

  return (
      <div className="badge-list" onDragOver={handleDragOver}>
          {badges.map((badge, index) => (
              <div
                  key={index}
                  className="badge-wrapper"
                  onDragStart={(event) => handleDragStart(event, index)}
                  onDrop={(event) => handleDrop(event, index)}
                  draggable="true"
              >
                  <Badge
                      text={badge.name}
                      enable={badge.enable}
                      onClick={(e) => {
                          onBadgeClick(index);
                      }}
                  />
              </div>
          ))}
      </div>
  );
}