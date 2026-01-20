import { At } from "@styled-icons/boxicons-regular";
import { File, XCircle, Trash, BellOff } from "@styled-icons/boxicons-solid";
import { observer } from "mobx-react-lite";
import { Channel, Message } from "revolt.js";
import styled from "styled-components/macro";

import { Text } from "preact-i18n";
import { StateUpdater, useEffect } from "preact/hooks";

import { IconButton } from "@revoltchat/ui";

import { internalSubscribe } from "../../../../lib/eventEmitter";

import { useApplicationState } from "../../../../mobx/State";
import { SECTION_MENTION } from "../../../../mobx/stores/Layout";
import { Reply } from "../../../../mobx/stores/MessageQueue";

import Tooltip from "../../../common/Tooltip";
import Markdown from "../../../markdown/Markdown";
import UserShort from "../../user/UserShort";
import { SystemMessage } from "../SystemMessage";
import { ReplyBase } from "../attachments/MessageReply";

interface Props {
    channel: Channel;
    replies: Reply[];
    setReplies: StateUpdater<Reply[]>;
}

const GlobalActions = styled.div`
    display: flex;
    padding: 6px 20px;
    background: var(--primary-header-background);
    border-bottom: 1px solid var(--border);
    justify-content: space-between;
    align-items: center;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--secondary-foreground);

    .label {
        opacity: 0.6;
        letter-spacing: 0.5px;
    }

    .group {
        display: flex;
        gap: 16px;
        align-items: center;
    }

    .btn {
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: color 0.15s ease;

        &:hover {
            color: var(--accent);
        }

        &.clear:hover {
            color: var(--error);
        }
    }
`;

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
    animation: bottomBounce 340ms cubic-bezier(0.2, 0.9, 0.5, 1.16) forwards;

    > div {
        flex-grow: 1;
        margin-bottom: 0;

        &::before {
            display: none;
        }
    }

    .toggle {
        gap: 2px;
        display: flex;
        font-size: 12px;
        align-items: center;
        font-weight: 800;
        text-transform: uppercase;
        min-width: 6ch;
    }

    .replyto {
        align-self: center;
        font-weight: 500;
        flex-shrink: 0;
    }

    .content {
        display: flex;
        pointer-events: none;

        .username {
            display: flex;
            align-items: center;
            gap: 6px;
            font-weight: 600;
            flex-shrink: 0;
        }

        .message {
            display: flex;
            max-height: 26px;
            gap: 4px;
        }
    }

    .actions {
        gap: 12px;
        display: flex;
    }
`;

// ! FIXME: Move to global config
const MAX_REPLIES = 5;
export default observer(({ channel, replies, setReplies }: Props) => {
    const client = channel.client;
    const layout = useApplicationState().layout;

    const allPinging = replies.length > 0 && replies.every((r) => r.mention);

    const toggleBulkMentions = () => {
        const newState = !allPinging;
        setReplies(replies.map((r) => ({ ...r, mention: newState })));
        layout.setSectionState(SECTION_MENTION, newState, false);
    };

    // Event listener for adding new messages to reply bar.
    useEffect(() => {
        return internalSubscribe("ReplyBar", "add", (_message) => {
            const message = _message as Message;
            if (
                replies.length >= MAX_REPLIES ||
                replies.find((x) => x.id === message._id)
            )
                return;

            setReplies([
                ...replies,
                {
                    id: message._id,
                    mention:
                        message.author_id === client.user!._id
                            ? false
                            : layout.getSectionState(SECTION_MENTION, false),
                },
            ]);
        });
    }, [replies, setReplies, client.user, layout]);

    // Map all the replies to messages we are aware of.
    const messages = replies.map((x) => client.messages.get(x.id));

    // Remove any replies which don't resolve to valid messages.
    useEffect(() => {
        if (messages.includes(undefined)) {
            setReplies(
                replies.filter((_, i) => typeof messages[i] !== "undefined"),
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages, replies, setReplies]);

    return (
        <div>
            {replies.length > 1 && (
                <GlobalActions>
                    <div className="group">
                        <span className="label">
                            <Text id="app.main.channel.reply.bulk_actions" />
                        </span>
                        <div className="btn" onClick={toggleBulkMentions}>
                            {allPinging ? (
                                <>
                                    <BellOff size={14} />
                                    <Text id="app.main.channel.reply.silence_all" />
                                </>
                            ) : (
                                <>
                                    <At size={14} />
                                    <Text id="app.main.channel.reply.mention_all" />
                                </>
                            )}
                        </div>
                    </div>
                    <div className="btn clear" onClick={() => setReplies([])}>
                        <Trash size={14} />
                        <Text id="app.main.channel.reply.clear_all" />
                    </div>
                </GlobalActions>
            )}

            {replies.map((reply, index) => {
                const message = messages[index];
                if (!message) return null;

                return (
                    <Base key={reply.id}>
                        <ReplyBase preview>
                            <div className="replyto">
                                <Text id="app.main.channel.reply.replying" />
                            </div>
                            <div className="content">
                                <div className="username">
                                    <UserShort
                                        size={16}
                                        showServerIdentity
                                        user={message.author}
                                        masquerade={message.masquerade!}
                                    />
                                </div>
                                <div className="message">
                                    {message.attachments && (
                                        <>
                                            <File size={16} />
                                            <em>
                                                {message.attachments.length >
                                                1 ? (
                                                    <Text id="app.main.channel.misc.sent_multiple_files" />
                                                ) : (
                                                    <Text id="app.main.channel.misc.sent_file" />
                                                )}
                                            </em>
                                        </>
                                    )}
                                    {message.author_id ===
                                    "00000000000000000000000000" ? (
                                        <SystemMessage
                                            message={message}
                                            hideInfo
                                        />
                                    ) : (
                                        message.content && (
                                            <Markdown
                                                disallowBigEmoji
                                                content={message.content.replace(
                                                    /\n/g,
                                                    " ",
                                                )}
                                            />
                                        )
                                    )}
                                </div>
                            </div>
                        </ReplyBase>
                        <span className="actions">
                            {message.author_id !== client.user!._id && (
                                <IconButton
                                    onClick={() => {
                                        let state = false;
                                        setReplies(
                                            replies.map((_, i) => {
                                                if (i === index) {
                                                    state = !_.mention;
                                                    return {
                                                        ..._,
                                                        mention: !_.mention,
                                                    };
                                                }
                                                return _;
                                            }),
                                        );

                                        layout.setSectionState(
                                            SECTION_MENTION,
                                            state,
                                            false,
                                        );
                                    }}>
                                    <Tooltip
                                        content={
                                            <Text id="app.main.channel.reply.toggle" />
                                        }>
                                        <span
                                            className="toggle"
                                            style={{
                                                color: reply.mention
                                                    ? "var(--accent)"
                                                    : "inherit",
                                            }}>
                                            <At size={15} />
                                            <Text
                                                id={
                                                    reply.mention
                                                        ? "general.on"
                                                        : "general.off"
                                                }
                                            />
                                        </span>
                                    </Tooltip>
                                </IconButton>
                            )}
                            <IconButton
                                onClick={() =>
                                    setReplies(
                                        replies.filter((_, i) => i !== index),
                                    )
                                }>
                                <XCircle size={16} />
                            </IconButton>
                        </span>
                    </Base>
                );
            })}
        </div>
    );
});
