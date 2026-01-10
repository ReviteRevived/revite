import { useHistory } from "react-router-dom";
import { useState } from "preact/hooks";
import { Modal, Button, InputBox, Category, Column } from "@revoltchat/ui";

import { useClient } from "../../client/ClientController";
import { mapError } from "../../client/jsx/error";
import { ModalProps } from "../types";

import styles from "./CreateServer.module.scss";

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

/**
 * Server creation & join modal
 */
export default function CreateOrJoinServer({
    ...props
}: ModalProps<"create_server">) {
    const history = useHistory();
    const client = useClient();

    const [tab, setTab] = useState<"create" | "join">("create");
    const [serverName, setServerName] = useState("");
    const [inviteCode, setInviteCode] = useState("");
    const [loading, setLoading] = useState(false);

    const navigateWhenReady = async (serverId: string) => {
        let attempts = 0;
        while (!client.servers.has(serverId) && attempts < 10) {
            await delay(250);
            attempts++;
        }
        history.push(`/server/${serverId}`);
    };

    const onExecute = async () => {
        setLoading(true);
        try {
            if (tab === "create") {
                if (!serverName.trim()) return;
                const server = await client.servers.createServer({
                    name: serverName,
                });
                await navigateWhenReady(server._id);
            } else {
                if (!inviteCode.trim()) return;

                const codeMatch = inviteCode.match(/([a-zA-Z0-9]+)$/);
                const code = codeMatch ? codeMatch[1] : inviteCode;

                const invite = await client.api.get(`/invites/${code as ""}`);

                if (invite.type === "Server") {
                    const serverId = invite.server_id;

                    if (client.servers.has(serverId)) {
                        history.push(`/server/${serverId}`);
                    } else {
                        const response = await client.api.post(
                            `/invites/${code as ""}`,
                        );
                        if (response.type === "Server") {
                            await navigateWhenReady(response.server._id);
                        }
                    }
                }
            }
            props.onClose?.();
        } catch (e) {
            alert(mapError(e));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal {...props}>
            <div className={styles.tabs}>
                <div
                    data-active={tab === "create"}
                    onClick={() => setTab("create")}>
                    Create
                </div>
                <div
                    data-active={tab === "join"}
                    onClick={() => setTab("join")}>
                    Join
                </div>
            </div>

            <Column gap="normal">
                <div>
                    <h2 style={{ marginBottom: "4px" }}>
                        {tab === "create" ? "Create a server" : "Join a server"}
                    </h2>
                    <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
                        By {tab === "create" ? "creating" : "joining"} a server,
                        you agree to the{" "}
                        <a
                            href="https://revolt.chat/aup"
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: "var(--error)" }}>
                            Acceptable Use Policy.
                        </a>
                    </p>
                </div>

                {tab === "create" ? (
                    <Column gap="small">
                        <Category>Server Name</Category>
                        <InputBox
                            value={serverName}
                            onInput={(e) =>
                                setServerName(e.currentTarget.value)
                            }
                            placeholder="My Awesome Server"
                        />
                    </Column>
                ) : (
                    <Column gap="small">
                        <Category>Invite Code or URL</Category>
                        <InputBox
                            value={inviteCode}
                            onInput={(e) =>
                                setInviteCode(e.currentTarget.value)
                            }
                            placeholder="jzTYxMae"
                        />
                    </Column>
                )}

                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "8px",
                        marginTop: "12px",
                    }}>
                    <Button onClick={props.onClose} light>
                        Cancel
                    </Button>
                    <Button
                        contrast={tab === "create"}
                        onClick={onExecute}
                        disabled={
                            loading ||
                            (tab === "create"
                                ? !serverName.trim()
                                : !inviteCode.trim())
                        }>
                        {loading ? "..." : tab === "create" ? "Create" : "Join"}
                    </Button>
                </div>
            </Column>
        </Modal>
    );
}
