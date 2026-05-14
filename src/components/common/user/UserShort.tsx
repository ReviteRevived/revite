import { TimeFive, Spa, Rocket } from "@styled-icons/boxicons-regular";
import { observer } from "mobx-react-lite";
import { useParams } from "react-router-dom";
import { User, API } from "revolt.js";
import styled, { css } from "styled-components/macro";
import { decodeTime } from "ulid";

import { Ref } from "preact";
import { Text } from "preact-i18n";

import { internalEmit } from "../../../lib/eventEmitter";

import { dayjs } from "../../../context/Locale";

import { useClient } from "../../../controllers/client/ClientController";
import { modalController } from "../../../controllers/modals/ModalController";
import Tooltip from "../Tooltip";
import UserIcon from "./UserIcon";

const shimmer = css`
    @keyframes shimmer {
        0% {
            background-position: -200% center;
        }
        100% {
            background-position: 200% center;
        }
    }
`;

const FreshMeatBadge = styled.span`
    ${shimmer}
    margin-inline-start: 4px;
    display: inline-flex;
    align-items: center;
    vertical-align: middle;

    background: linear-gradient(90deg, #ffd700, #fff5b1, #ffcc00, #ffd700);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmer 3s linear infinite;
    filter: drop-shadow(0 0 2px rgba(255, 215, 0, 0.4));
`;

const NewUserBadge = styled.span`
    color: var(--accent);
    margin-inline-start: 4px;
    display: inline-flex;
    align-items: center;
    vertical-align: middle;
`;

const BotBadge = styled.div`
    display: inline-block;
    flex-shrink: 0;
    height: 1.4em;
    padding: 0 4px;
    font-size: 0.6em;
    user-select: none;
    margin-inline-start: 4px;
    text-transform: uppercase;
    color: var(--accent-contrast);
    background: var(--accent);
    border-radius: calc(var(--border-radius) / 2);
`;

type UsernameProps = Omit<
    JSX.HTMLAttributes<HTMLElement>,
    "children" | "as"
> & {
    user?: User;
    prefixAt?: boolean;
    masquerade?: API.Masquerade;
    showServerIdentity?: boolean | "both";
    isSidebar?: boolean;
    override?: string;
    innerRef?: Ref<any>;
};

const Name = styled.span<{ colour?: string | null }>`
    ${(props) =>
        props.colour &&
        (props.colour.includes("gradient")
            ? css`
                  background: ${props.colour};
                  background-clip: text;
                  -webkit-background-clip: text;
                  -webkit-text-fill-color: transparent;
              `
            : css`
                  color: ${props.colour};
              `)}
`;

export const Username = observer(
    ({
        user,
        prefixAt,
        masquerade,
        showServerIdentity,
        isSidebar,
        innerRef,
        override,
        ...otherProps
    }: UsernameProps) => {
        let username =
            (user as unknown as { display_name: string })?.display_name ??
            user?.username;
        let color = masquerade?.colour;
        let timed_out: Date | undefined;

        let isFreshMeat = false;
        let isNew2Server = false;

        if (user?._id) {
            try {
                const createdAt = decodeTime(user._id);
                isFreshMeat = dayjs().diff(createdAt, "day") < 1;
            } catch (e) {}
        }

        if (override) {
            username = override;
        } else if (user && showServerIdentity) {
            const { server } = useParams<{ server?: string }>();
            if (server) {
                const client = useClient();
                const member = client.members.getKey({
                    server,
                    user: user._id,
                });

                if (member) {
                    if (member.nickname) {
                        if (showServerIdentity === "both") {
                            username = `${member.nickname} (${username})`;
                        } else {
                            username = member.nickname;
                        }
                    }

                    if (member.timeout) {
                        timed_out = member.timeout;
                    }

                    if (member.joined_at) {
                        isNew2Server =
                            dayjs().diff(member.joined_at, "day") < 1;
                    }

                    if (!color) {
                        for (const [_, { colour }] of member.orderedRoles) {
                            if (colour) {
                                color = colour;
                            }
                        }
                    }
                }
            }
        }

        const el = (
            <>
                <Name {...otherProps} ref={innerRef} colour={color}>
                    {prefixAt ? "@" : undefined}
                    {masquerade?.name ?? username ?? (
                        <Text id="app.main.channel.unknown_user" />
                    )}
                </Name>

                {timed_out && (
                    <Tooltip
                        content={
                            <Text
                                id="app.main.channel.user_timed_out"
                                fields={{
                                    time: dayjs(timed_out).fromNow(true),
                                }}
                            />
                        }>
                        <TimeFive
                            size={16}
                            color="var(--secondary-foreground)"
                        />
                    </Tooltip>
                )}

                {!isSidebar &&
                    (isFreshMeat ? (
                        <Tooltip content="New to Stoat">
                            <FreshMeatBadge>
                                <Rocket size={18} />
                            </FreshMeatBadge>
                        </Tooltip>
                    ) : isNew2Server ? (
                        <Tooltip content="New to the server">
                            <NewUserBadge>
                                <Spa size={16} style={{ opacity: 0.7 }} />
                            </NewUserBadge>
                        </Tooltip>
                    ) : null)}
            </>
        );

        if (user?.bot) {
            return (
                <>
                    {el}
                    <BotBadge>
                        <Text
                            id={
                                masquerade
                                    ? "app.main.channel.bridge"
                                    : "app.main.channel.bot"
                            }
                        />
                    </BotBadge>
                </>
            );
        }

        return el;
    },
);

export default function UserShort({
    user,
    size,
    prefixAt,
    masquerade,
    showServerIdentity,
    isSidebar,
}: {
    user?: User;
    size?: number;
    prefixAt?: boolean;
    masquerade?: API.Masquerade;
    showServerIdentity?: boolean;
    isSidebar?: boolean;
}) {
    const openProfile = () =>
        user &&
        modalController.push({ type: "user_profile", user_id: user._id });

    const handleUserClick = (e: MouseEvent) => {
        if (e.shiftKey && user?._id) {
            e.preventDefault();
            internalEmit("MessageBox", "append", `<@${user?._id}>`, "mention");
        } else {
            openProfile();
        }
    };

    return (
        <>
            <UserIcon
                target={user}
                size={size ?? 24}
                masquerade={masquerade}
                onClick={handleUserClick}
                showServerIdentity={showServerIdentity}
            />
            <Username
                user={user}
                prefixAt={prefixAt}
                masquerade={masquerade}
                onClick={handleUserClick}
                showServerIdentity={showServerIdentity}
                isSidebar={isSidebar}
            />
        </>
    );
}
