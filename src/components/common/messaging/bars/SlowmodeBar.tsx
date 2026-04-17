// Major work-in-progress
import { Hourglass } from "@styled-icons/boxicons-solid";
import { observer } from "mobx-react-lite";
import { Channel } from "revolt.js";
import styled from "styled-components/macro";

import { Text } from "preact-i18n";
import { useEffect, useState } from "preact/hooks";

import { fetchSlowmode } from "../../Reuseables";

interface Props {
    channel: Channel;
}

const Base = styled.div`
    @keyframes bottomBounce {
        0% {
            transform: translateY(33px);
        }
        100% {
            transform: translateY(0px);
        }
    }

    display: flex;
    height: 30px;
    padding: 0 20px;
    user-select: none;
    align-items: center;
    background: var(--secondary-background);
    border-top: 1px solid var(--border);
    animation: bottomBounce 340ms cubic-bezier(0.2, 0.9, 0.5, 1.16) forwards;

    .content {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-grow: 1;
        font-size: 12px;
        font-weight: 500;
        color: var(--secondary-foreground);

        svg {
            color: var(--accent);
        }

        strong {
            color: var(--foreground);
            font-weight: 700;
        }
    }
`;

const formatSlowmode = (seconds: number): string => {
    if (seconds === 0) return "Off";
    if (seconds >= 3600 && seconds % 3600 === 0) return `${seconds / 3600}h`;
    if (seconds >= 60 && seconds % 60 === 0) return `${seconds / 60}m`;
    return `${seconds}s`;
};

export default observer(({ channel }: Props) => {
    const [slowmode, setSlowmode] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setSlowmode(0);

        const channelId = (channel as any)._id;
        if (channelId) {
            fetchSlowmode(channel, setSlowmode, setLoading);
        }
    }, [(channel as any)._id]);

    if (loading || slowmode === 0) return null;

    return (
        <Base>
            <div className="content">
                <Hourglass size={14} />
                <span>
                    <Text id="app.main.channel.slowmode.active" />
                    {": "}
                    <strong>{formatSlowmode(slowmode)}</strong>
                </span>
            </div>
        </Base>
    );
});
