
export function Badge({ children, enable, onClick, text }: {
    children?: React.ReactNode;
    enable: boolean;
    onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
    text?: string;
}) {
    return (
        <div
            className={`badge ${enable ? "badge-enabled" : "badge-disabled"}`}
            onClick={onClick}
            draggable="true"
        >
            <div className="badge-text">{children ?? text}</div>
        </div>
    );
}

export function BadgeList({ badges, onBadgeClick, onBadgeSwap, swapable = false }) {
    const swapWithAnim = (ele1, ele2) => {
        const posA = ele1.getBoundingClientRect();
        const posB = ele2.getBoundingClientRect();

        ele1.animate([
            { transform: `translate(0,0)` },
            { transform: `translate(${posB.left - posA.left}px, ${posB.top - posA.top}px)` }
        ], {
            duration: 200,
            easing: "ease-in-out"
        });

        return ele2.animate([
            { transform: `translate(0,0)` },
            { transform: `translate(${posA.left - posB.left}px, ${posA.top - posB.top}px)` }
        ], {
            duration: 200,
            easing: "ease-in-out"
        }).finished;
    }

    const refBadgeList = React.useRef<HTMLDivElement>(null);
    const swapBadge = (index1, index2) => {
        const badgeList = refBadgeList.current;
        const badge1 = badgeList.children[index1];
        const badge2 = badgeList.children[index2];
        if (badge1 && badge2) {
            swapWithAnim(badge1, badge2).then(() => {
                onBadgeSwap(index1, index2);
            });
        }
    }

    return (
        <div className={`badge-list ${swapable && 'badge-list-swap'}`} ref={refBadgeList}>
            {badges.map((badge, index) => (
                <div
                    key={badge.name}
                    className="badge-wrapper"
                    draggable="true"
                >
                    <Badge
                        enable={badge.enable}
                        onClick={(e) => {
                            onBadgeClick(index);
                        }}
                    >
                        {swapable && <button 
                            className="badge-swap-button"
                            onClick={(e) => {
                                e.stopPropagation();
                                swapBadge(index, index - 1);
                            }}
                        >{'<'}</button>}
                        <span>{badge.name}</span>
                        {swapable && <button 
                            className="badge-swap-button"
                            onClick={(e) => {
                                e.stopPropagation();
                                swapBadge(index, index + 1);
                            }}
                        >{'>'}</button>}
                    </Badge>
                </div>
            ))}
        </div>
    );
}