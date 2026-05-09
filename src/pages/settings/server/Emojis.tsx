import { Trash } from "@styled-icons/boxicons-regular";
import { observer } from "mobx-react-lite";
import React, { useMemo, useState } from "react";
import { Server } from "revolt.js";
import styled from "styled-components";

import { Text } from "preact-i18n";

import { Column, Row, InputBox, IconButton, Modal } from "@revoltchat/ui";

import UserShort from "../../../components/common/user/UserShort";
import { EmojiUploader } from "../../../components/settings/customisation/EmojiUploader";

interface Props {
    server: Server;
}

const EmojiGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
    margin-top: 16px;
`;

const EmojiCard = styled.div`
    background: var(--secondary-background);
    border-radius: var(--border-radius);
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    border: 1px solid transparent;
    transition: border-color 0.2s ease;

    &:hover {
        border-color: var(--primary-accent);
    }

    .banner {
        display: flex;
        align-items: center;
        gap: 16px;
        width: 100%;
        overflow: hidden;
    }

    .details {
        display: flex;
        flex-grow: 1;
        gap: 2px;
        flex-direction: column;
        min-width: 0;
    }

    .name {
        font-size: 1.2rem;
        font-weight: 600;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
    }
`;

const Preview = styled.img`
    width: 48px;
    height: 48px;
    object-fit: contain;
    flex-shrink: 0;
    border-radius: var(--border-radius);
    background: var(--secondary-header);
    padding: 4px;
`;

export const Emojis = observer(({ server }: Props) => {
    const [search, setSearch] = useState("");
    const [error, setError] = useState(false);
    const [deleting, setDeleting] = useState<any>(null);

    const canManage = server.havePermission("ManageCustomisation");

    const handleSearchInput = (val: string) => {
        if (/[^a-z0-9]/.test(val) && val !== "") {
            setError(true);
        } else {
            setError(false);
        }
        setSearch(val.toLowerCase().replace(/[^a-z0-9]/g, ""));
    };

    const emojis = useMemo(() => {
        return [...server.client.emojis.values()]
            .filter(
                (x) => x.parent.type === "Server" && x.parent.id === server._id,
            )
            .filter((x) => x.name.includes(search));
    }, [server.client.emojis.values(), server._id, search]);

    return (
        <Column gap="normal">
            {canManage && <EmojiUploader server={server} />}

            <Row centred gap="normal" style={{ marginTop: "10px" }}>
                <h3 style={{ margin: 0, flexGrow: 1 }}>
                    <Text id="app.settings.server_pages.emojis.title" />
                    {" – "}
                    {emojis.length}
                </h3>
                <div style={{ width: "250px" }}>
                    <InputBox
                        placeholder="Filter emojis..."
                        value={search}
                        onInput={(e) =>
                            handleSearchInput(e.currentTarget.value)
                        }
                        style={
                            error ? { border: "1px solid var(--error)" } : {}
                        }
                    />
                </div>
            </Row>

            <EmojiGrid>
                {emojis.map((emoji) => (
                    <EmojiCard key={emoji._id}>
                        <div className="banner">
                            <Preview src={emoji.imageURL} />
                            <div className="details">
                                <div className="name">{`:${emoji.name}:`}</div>
                                <UserShort user={emoji.creator} />
                            </div>
                            {canManage && (
                                <IconButton
                                    palette="error"
                                    onClick={() => setDeleting(emoji)}>
                                    <Trash size={20} />
                                </IconButton>
                            )}
                        </div>
                    </EmojiCard>
                ))}
            </EmojiGrid>

            {/* TODO: Find a way to properly render emojis as deleted after this happens*/}
            {deleting && (
                <Modal
                    title="Delete Emoji"
                    onClose={() => setDeleting(null)}
                    actions={[
                        {
                            confirmation: true,
                            children: (
                                <Text id="app.special.modals.actions.delete" />
                            ),
                            palette: "error",
                            onClick: async () => {
                                await deleting.delete();
                                return true;
                            },
                        },
                        {
                            children: (
                                <Text id="app.special.modals.actions.close" />
                            ),
                            onClick: () => setDeleting(null),
                        },
                    ]}>
                    <p>
                        Are you sure you want to delete the emoji{" "}
                        <b>:{deleting.name}:</b>? This action cannot be undone.
                    </p>
                </Modal>
            )}

            {emojis.length === 0 && (
                <div
                    style={{
                        padding: "40px",
                        textAlign: "center",
                        opacity: 0.5,
                    }}>
                    <p>It's very lonely.. :c</p>
                </div>
            )}
        </Column>
    );
});
