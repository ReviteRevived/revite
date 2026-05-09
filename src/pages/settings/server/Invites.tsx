import { Trash, Copy } from "@styled-icons/boxicons-regular";
import { observer } from "mobx-react-lite";
import { Virtuoso } from "react-virtuoso";
import { API, Server } from "revolt.js";

import styles from "./Panes.module.scss";
import { Text } from "preact-i18n";
import { useEffect, useState, useMemo } from "preact/hooks";

import { IconButton, Preloader, InputBox } from "@revoltchat/ui";

import { normalize } from "../../../components/common/Reuseables";
import UserIcon from "../../../components/common/user/UserIcon";
import UserShort from "../../../components/common/user/UserShort";
import { ChannelName } from "../../../controllers/client/jsx/ChannelName";

interface InnerProps {
    invite: API.Invite;
    server: Server;
    removeSelf: () => void;
}

const Inner = observer(({ invite, server, removeSelf }: InnerProps) => {
    const [deleting, setDelete] = useState(false);

    const user = server.client.users.get(invite.creator);
    const channel = server.client.channels.get(invite.channel);

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
            <span>
                <ChannelName channel={channel} prefix />
            </span>
            <IconButton
                onClick={() => {
                    setDelete(true);
                    server.client.deleteInvite(invite._id).then(removeSelf);
                }}>
                <Trash size={24} color={"var(--error)"} />
            </IconButton>
        </div>
    );
});

interface Props {
    server: Server;
}

export const Invites = observer(({ server }: Props) => {
    const [invites, setInvites] = useState<API.Invite[] | undefined>(undefined);
    const [search, setSearch] = useState("");

    useEffect(() => {
        server.fetchInvites().then((v) => setInvites(v));
    }, [server, setInvites]);

    const filteredInvites = useMemo(() => {
        if (!invites) return [];
        if (!search) return invites;

        const q = normalize(search);
        return invites.filter((invite) => {
            const user = server.client.users.get(invite.creator);
            const channel = server.client.channels.get(invite.channel);

            return (
                normalize(invite._id).includes(q) ||
                (user && normalize(user.username).includes(q)) ||
                (channel && normalize(channel.name).includes(q))
            );
        });
    }, [invites, search, server.client.users, server.client.channels]);

    return (
        <div className={styles.userList}>
            <div style={{ padding: "0 0 16px 0" }}>
                <InputBox
                    placeholder="Search invites..."
                    value={search}
                    onInput={(e) => setSearch(e.currentTarget.value)}
                />
            </div>

            <div className={styles.subtitle}>
                <span>
                    <Text id="app.settings.server_pages.invites.code" />
                </span>
                <span>
                    <Text id="app.settings.server_pages.invites.invitor" />
                </span>
                <span>
                    <Text id="app.settings.server_pages.invites.channel" />
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
                                        server={server}
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
