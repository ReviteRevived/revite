/* eslint-disable react/jsx-no-literals */
import { Copy, Trash } from "@styled-icons/boxicons-regular";
import { observer } from "mobx-react-lite";
import { Virtuoso } from "react-virtuoso";
import { API, Channel } from "revolt.js";

import styles from "../server/Panes.module.scss";
import { Text } from "preact-i18n";
import { useEffect, useMemo, useState } from "preact/hooks";

import { Button, IconButton, InputBox, Preloader } from "@revoltchat/ui";

import { normalize } from "../../../components/common/Reuseables";
import UserShort from "../../../components/common/user/UserShort";
import { modalController } from "../../../controllers/modals/ModalController";

interface InnerProps {
    invite: API.Invite;
    channel: Channel;
    removeSelf: () => void;
}

const Inner = observer(({ invite, channel, removeSelf }: InnerProps) => {
    const [deleting, setDelete] = useState(false);
    const user = channel.client.users.get(invite.creator);

    const copyCode = (e: MouseEvent) => {
        e.preventDefault();
        navigator.clipboard.writeText(invite._id);
    };

    return (
        <div className={styles.invite} data-deleting={deleting}>
            <code
                onMouseDown={(e) => e.preventDefault()}
                onClick={copyCode}
                style={{
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    userSelect: "none",
                }}
                title="Click to copy">
                {invite._id}
                <Copy size={14} style={{ opacity: 0.5 }} />
            </code>
            <span>
                <UserShort user={user} size={24} showServerIdentity={true} />
            </span>
            <IconButton
                onClick={() => {
                    setDelete(true);
                    channel.client.deleteInvite(invite._id).then(removeSelf);
                }}>
                <Trash size={24} color={"var(--error)"} />
            </IconButton>
        </div>
    );
});

interface Props {
    channel: Channel;
}

export const ChannelInvites = observer(({ channel }: Props) => {
    const [invites, setInvites] = useState<API.Invite[] | undefined>(undefined);
    const [search, setSearch] = useState("");

    const server = channel.server;

    useEffect(() => {
        if (server) {
            server.fetchInvites().then((allInvites) => {
                const channelSpecific = allInvites.filter(
                    (invite) => invite.channel === channel._id,
                );
                setInvites(channelSpecific);
            });
        } else {
            setInvites([]);
        }
    }, [server, channel._id]);

    const filteredInvites = useMemo(() => {
        if (!invites) return [];
        if (!search) return invites;

        const q = normalize(search);
        return invites.filter((invite) => {
            const user = channel.client.users.get(invite.creator);

            return (
                normalize(invite._id).includes(q) ||
                (user && normalize(user.username).includes(q))
            );
        });
    }, [invites, search, channel.client.users]);

    function openInviteModal() {
        modalController.push({
            type: "create_invite",
            target: channel,
        });
    }

    return (
        <div className={styles.userList}>
            <div
                style={{
                    padding: "0 0 16px 0",
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                }}>
                <div style={{ flexGrow: 1 }}>
                    <InputBox
                        placeholder="Search channel invites..."
                        value={search}
                        onInput={(e) => setSearch(e.currentTarget.value)}
                    />
                </div>
                <Button
                    onClick={openInviteModal}
                    palette="primary"
                    style={{
                        padding: "0 16px",
                        height: "38px",
                        backgroundColor: "var(--accent)",
                        color: "var(--foreground)",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: 500,
                        whiteSpace: "nowrap",
                    }}>
                    <Text id="app.context_menu.create_invite" />
                </Button>
            </div>

            <div className={styles.subtitle}>
                <span>
                    <Text id="app.settings.server_pages.invites.code" />
                </span>
                <span>
                    <Text id="app.settings.server_pages.invites.invitor" />
                </span>
                <span>
                    <Text id="app.settings.server_pages.invites.revoke" />
                </span>
            </div>

            {typeof invites === "undefined" && (
                <div style={{ padding: "40px", textAlign: "center" }}>
                    <Preloader type="ring" />
                </div>
            )}

            {invites && (
                <div className={styles.virtual}>
                    {filteredInvites.length === 0 ? (
                        <div
                            style={{
                                padding: "40px",
                                textAlign: "center",
                                opacity: 0.5,
                            }}>
                            <p>Where'd everybody goo??</p>
                        </div>
                    ) : (
                        <Virtuoso
                            style={{ height: "100%" }}
                            totalCount={filteredInvites.length}
                            itemContent={(index) => {
                                const invite = filteredInvites[index];
                                return (
                                    <Inner
                                        key={invite._id}
                                        invite={invite}
                                        channel={channel}
                                        removeSelf={() =>
                                            setInvites(
                                                invites.filter(
                                                    (x) => x._id !== invite._id,
                                                ),
                                            )
                                        }
                                    />
                                );
                            }}
                        />
                    )}
                </div>
            )}
        </div>
    );
});
