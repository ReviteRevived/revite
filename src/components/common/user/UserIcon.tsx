import {
    Circle,
    Ghost,
    MicrophoneOff,
    Moon,
    NoEntry,
    VolumeMute,
} from "@styled-icons/boxicons-solid";
import { observer } from "mobx-react-lite";
import { useParams } from "react-router-dom";
import { API, User } from "revolt.js";
import styled, { css } from "styled-components/macro";

import { useApplicationState } from "../../../mobx/State";

import fallback from "../assets/user.png";

import { useClient } from "../../../controllers/client/ClientController";
import IconBase, { IconBaseProps } from "../IconBase";

type VoiceStatus = "muted" | "deaf";
interface Props extends IconBaseProps<User> {
    status?: boolean;
    override?: string;
    voice?: VoiceStatus;
    masquerade?: API.Masquerade;
    showServerIdentity?: boolean;
}

export function useStatusColour(user?: User) {
    const theme = useApplicationState().settings.theme;

    return user?.online && user?.status?.presence !== "Invisible"
        ? user?.status?.presence === "Idle"
            ? theme.getVariable("status-away")
            : user?.status?.presence === "Focus"
            ? theme.getVariable("status-focus")
            : user?.status?.presence === "Busy"
            ? theme.getVariable("status-busy")
            : theme.getVariable("status-online")
        : theme.getVariable("status-invisible");
}

const VoiceIndicator = styled.div<{ status: VoiceStatus }>`
    width: 10px;
    height: 10px;
    border-radius: var(--border-radius-half);

    display: flex;
    align-items: center;
    justify-content: center;

    ${(props) =>
        (props.status === "muted" || props.status === "deaf") &&
        css`
            background: var(--error);
        `}
`;

export default observer(
    (
        props: Props &
            Omit<
                JSX.SVGAttributes<SVGSVGElement>,
                keyof Props | "children" | "as"
            >,
    ) => {
        const client = useClient();
        const settings = useApplicationState().settings;

        const {
            target,
            attachment,
            size,
            status,
            animate,
            mask,
            hover,
            showServerIdentity,
            masquerade,
            innerRef,
            override,
            ...svgProps
        } = props;

        let { url } = props;
        if (masquerade?.avatar) {
            url = client.proxyFile(masquerade.avatar);
        } else if (override) {
            url = override;
        } else if (!url) {
            let override;
            if (target && showServerIdentity) {
                const { server } = useParams<{ server?: string }>();
                if (server) {
                    const member = client.members.getKey({
                        server,
                        user: target._id,
                    });

                    if (member?.avatar) {
                        override = member?.avatar;
                    }
                }
            }

            url =
                client.generateFileURL(
                    override ?? target?.avatar ?? attachment ?? undefined,
                    { max_side: 256 },
                    animate,
                ) ?? (target ? target.defaultAvatarURL : fallback);
        }

        const showOriginalStatus =
            settings.get("appearance:show_original_status") ?? false;
        const presence =
            target?.online && target?.status?.presence !== "Invisible"
                ? target?.status?.presence ?? "Online"
                : "Invisible";

        const statusColor = useStatusColour(target);

        return (
            <IconBase
                {...svgProps}
                ref={innerRef}
                width={size}
                height={size}
                hover={hover}
                borderRadius="--border-radius-user-icon"
                aria-hidden="true"
                viewBox="0 0 32 32">
                <foreignObject
                    x="0"
                    y="0"
                    width="32"
                    height="32"
                    className="icon"
                    mask={mask ?? (status ? "url(#user)" : undefined)}>
                    {<img src={url} draggable={false} loading="lazy" />}
                </foreignObject>
                {props.status &&
                    (showOriginalStatus ? (
                        <circle cx="27" cy="27" r="5" fill={statusColor} />
                    ) : (
                        <foreignObject
                            x="21"
                            y="21"
                            width="12"
                            height="12"
                            requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility">
                            <svg
                                viewBox="0 0 24 24"
                                width="12"
                                height="12"
                                style={{
                                    color: statusColor,
                                    display: "block",
                                }}>
                                {presence === "Idle" && (
                                    <Moon size={24} fill="currentColor" />
                                )}
                                {presence === "Busy" && (
                                    <NoEntry size={24} fill="currentColor" />
                                )}
                                {presence === "Focus" && (
                                    <NoEntry size={24} fill="currentColor" />
                                )}
                                {presence === "Online" && (
                                    <Circle size={24} fill="currentColor" />
                                )}
                                {presence === "Invisible" && (
                                    <Ghost
                                        size={24}
                                        fill="currentColor"
                                        style={{ opacity: 0.5 }}
                                    />
                                )}
                            </svg>
                        </foreignObject>
                    ))}
                {props.voice && (
                    <foreignObject x="22" y="22" width="10" height="10">
                        <VoiceIndicator status={props.voice}>
                            {(props.voice === "deaf" && (
                                <VolumeMute size={6} />
                            )) ||
                                (props.voice === "muted" && (
                                    <MicrophoneOff size={6} />
                                ))}
                        </VoiceIndicator>
                    </foreignObject>
                )}
            </IconBase>
        );
    },
);
