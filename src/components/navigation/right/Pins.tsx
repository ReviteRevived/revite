import { Link, useParams } from "react-router-dom";
import { Message as MessageI } from "revolt.js";
import styled from "styled-components/macro";

import { Text } from "preact-i18n";
import { useEffect, useState } from "preact/hooks";

import { Category, Error, Preloader } from "@revoltchat/ui";

import { useClient } from "../../../controllers/client/ClientController";
import Message from "../../common/messaging/Message";
import { GenericSidebarBase, GenericSidebarList } from "../SidebarBase";

const PinsBase = styled.div`
    padding: 6px;

    .list {
        gap: 4px;
        margin: 8px 0;
        display: flex;
        flex-direction: column;
    }

    .message {
        margin: 2px;
        padding: 6px;
        overflow: hidden;
        border-radius: var(--border-radius);
        color: var(--foreground);
        background: var(--primary-background);

        &:hover {
            background: var(--hover);
        }

        > * {
            pointer-events: none;
        }
    }
`;

interface Props {
    close: () => void;
}

export function PinnedMessages({ close }: Props) {
    const channel = useClient().channels.get(
        useParams<{ channel: string }>().channel,
    )!;

    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState<MessageI[]>([]);

    async function fetchPins() {
        setLoading(true);
        try {
            const data = await channel.searchWithUsers({
                pinned: true,
                sort: "Latest",
            });
            setMessages(data.messages);
        } catch (e) {
            console.error("Failed to fetch pins", e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchPins();
    }, [channel?.id]);

    return (
        <GenericSidebarBase data-scroll-offset="with-padding">
            <GenericSidebarList>
                <PinsBase>
                    <Category>
                        <Error
                            error={<a onClick={close}>« back to members</a>}
                        />
                    </Category>
                    <Category></Category>

                    {loading && <Preloader type="ring" />}

                    {!loading && messages.length === 0 && (
                        <p
                            style={{
                                textAlign: "center",
                                opacity: 0.5,
                                marginTop: "20px",
                            }}>
                            No pinned messages yet.
                        </p>
                    )}

                    {!loading && (
                        <div className="list">
                            {messages.map((message) => {
                                let href = "";
                                if (channel?.channel_type === "TextChannel") {
                                    href += `/server/${channel.server_id}`;
                                }

                                href += `/channel/${message.channel_id}/${message._id}`;

                                return (
                                    <Link to={href} key={message._id}>
                                        <div className="message">
                                            <Message
                                                message={message}
                                                head
                                                hideReply
                                            />
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </PinsBase>
            </GenericSidebarList>
        </GenericSidebarBase>
    );
}
