/* eslint-disable react/jsx-no-literals */
import { observer } from "mobx-react-lite";

import styles from "./Panes.module.scss";
import { useEffect, useState } from "preact/hooks";

import {
    Button,
    Column,
    InputBox,
    LineDivider,
    ObservedInputElement,
    Tip,
} from "@revoltchat/ui";

import { useApplicationState } from "../../../mobx/State";

import { rpcService } from "../../../controllers/RpcService";

export const RpcSettings = observer(() => {
    const { settings } = useApplicationState();

    const [lfmKey, setLfmKey] = useState("");
    const [lfmUser, setLfmUser] = useState("");
    const [discordId, setDiscordId] = useState("");
    const [priority, setPriority] = useState("rotate");

    const [showApiKey, setShowApiKey] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setLfmKey(settings.get("rpc:lastfm_api_key", "") ?? "");
        setLfmUser(settings.get("rpc:lastfm_username", "") ?? "");
        setDiscordId(settings.get("rpc:discord_user_id", "") ?? "");
        setPriority(
            (settings.get("rpc:priority", "rotate") as string) ?? "rotate",
        );
    }, [settings]);

    const hasChanges =
        lfmKey.trim() !== settings.get("rpc:lastfm_api_key", "") ||
        lfmUser.trim() !== settings.get("rpc:lastfm_username", "") ||
        discordId.trim() !== settings.get("rpc:discord_user_id", "") ||
        priority !== settings.get("rpc:priority", "rotate");

    const handleSave = async () => {
        if (!hasChanges) return;

        setIsSaving(true);
        try {
            settings.set("rpc:lastfm_api_key", lfmKey.trim());
            settings.set("rpc:lastfm_username", lfmUser.trim());
            settings.set("rpc:discord_user_id", discordId.trim());
            settings.set("rpc:priority", priority);

            await rpcService.forceRefresh();
        } catch (error) {
            console.error(
                "Failed to apply rich presence configuration updates:",
                error,
            );
        } finally {
            setIsSaving(false);
        }
    };

    const labelStyle = {
        display: "block",
        fontSize: "12px",
        fontWeight: 600,
        marginBottom: "8px",
    };

    const subtextStyle = {
        color: "var(--tertiary-foreground)",
        fontSize: "0.875rem",
    };

    return (
        <div className={styles.myBots}>
            <h1>Activity</h1>
            <Column gap="xlarge">
                <LineDivider />

                <section className={styles.botSection} style={{ margin: 0 }}>
                    <div className={styles.infoheader}>
                        <div className={styles.container}>
                            <div className={styles.userDetail}>
                                <div className={styles.username}>
                                    <span>Activity Status</span>
                                    <span
                                        style={{
                                            width: "8px",
                                            height: "8px",
                                            borderRadius: "50%",
                                            background: rpcService.isSyncPaused
                                                ? "var(--status-away, #e0a100)"
                                                : "var(--status-online, #43b581)",
                                        }}
                                    />
                                </div>
                                <div className={styles.userid}>
                                    <span>
                                        {rpcService.isSyncPaused
                                            ? "Paused"
                                            : "Active"}
                                    </span>
                                </div>
                            </div>

                            <div className={styles.buttonRow}>
                                <Button
                                    palette={
                                        rpcService.isSyncPaused
                                            ? "primary"
                                            : "secondary"
                                    }
                                    onClick={() => rpcService.togglePause()}
                                    compact>
                                    {rpcService.isSyncPaused
                                        ? "Resume"
                                        : "Pause"}
                                </Button>
                                <Button
                                    palette="secondary"
                                    disabled={
                                        rpcService.isSyncPaused ||
                                        rpcService.isRefreshing
                                    }
                                    onClick={() => rpcService.forceRefresh()}
                                    compact>
                                    {rpcService.isRefreshing
                                        ? "Updating..."
                                        : "Refresh"}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className={styles.botList}>
                        <div className={styles.botCard}>
                            <div className={styles.infocontainer}>
                                {rpcService.activeTrack ? (
                                    <div style={{ display: "contents" }}>
                                        <img
                                            src={
                                                rpcService.activeTrack
                                                    .albumArt ||
                                                "https://placehold.co/48"
                                            }
                                            className={styles.avatar}
                                            style={{
                                                width: "48px",
                                                height: "48px",
                                                borderRadius:
                                                    "var(--border-radius)",
                                                objectFit: "cover",
                                            }}
                                            alt="Cover Art"
                                            onError={(e) => {
                                                e.currentTarget.src =
                                                    "https://placehold.co/48";
                                            }}
                                        />
                                        <div
                                            className={styles.infoheader}
                                            style={{ padding: 0 }}>
                                            <div className={styles.userDetail}>
                                                <span
                                                    className={styles.username}
                                                    style={{
                                                        fontSize: "1rem",
                                                    }}>
                                                    {
                                                        rpcService.activeTrack
                                                            .title
                                                    }
                                                </span>
                                                <span className={styles.userid}>
                                                    by{" "}
                                                    {
                                                        rpcService.activeTrack
                                                            .artist
                                                    }
                                                </span>
                                                <span
                                                    className={styles.userid}
                                                    style={{
                                                        opacity: 0.5,
                                                        fontSize: "10px",
                                                    }}>
                                                    {
                                                        rpcService.activeTrack
                                                            .source
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        style={{
                                            ...subtextStyle,
                                            padding: "12px 4px",
                                            width: "100%",
                                            textAlign: "center",
                                        }}
                                    />
                                )}
                            </div>
                        </div>

                        <div className={styles.botCard}>
                            <div className={styles.infocontainer}>
                                {rpcService.activeGame ? (
                                    <div style={{ display: "contents" }}>
                                        <img
                                            src={
                                                rpcService.activeGame
                                                    .largeImage ||
                                                "https://placehold.co/48"
                                            }
                                            className={styles.avatar}
                                            style={{
                                                width: "48px",
                                                height: "48px",
                                                borderRadius:
                                                    "var(--border-radius)",
                                                objectFit: "cover",
                                            }}
                                            alt="Game Target Frame"
                                        />
                                        <div
                                            className={styles.infoheader}
                                            style={{ padding: 0 }}>
                                            <div className={styles.userDetail}>
                                                <span
                                                    className={styles.username}
                                                    style={{
                                                        fontSize: "1rem",
                                                    }}>
                                                    {rpcService.activeGame.name}
                                                </span>
                                                <span className={styles.userid}>
                                                    {rpcService.activeGame
                                                        .details ||
                                                        "Active Focus"}
                                                </span>
                                                <span
                                                    className={styles.userid}
                                                    style={{
                                                        opacity: 0.5,
                                                        fontSize: "10px",
                                                    }}>
                                                    {rpcService.activeGame
                                                        .state || "In Session"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        style={{
                                            ...subtextStyle,
                                            padding: "12px 4px",
                                            width: "100%",
                                            textAlign: "center",
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <LineDivider />

                <section>
                    <Column gap="normal">
                        <div>
                            <span style={labelStyle}>Status Priority</span>
                            <ObservedInputElement
                                type="combo"
                                value={() => priority}
                                onChange={(value) =>
                                    setPriority(value as string)
                                }
                                options={[
                                    {
                                        value: "rotate",
                                        name: "Rotate (every 5 mins)",
                                    },
                                    {
                                        value: "music",
                                        name: "Music",
                                    },
                                    {
                                        value: "games",
                                        name: "Gaming",
                                    },
                                ]}
                            />
                        </div>

                        <div>
                            <span style={labelStyle}>Last.fm API Key</span>
                            <div
                                style={{
                                    display: "flex",
                                    gap: "8px",
                                    alignItems: "center",
                                }}>
                                <div style={{ flexGrow: 1 }}>
                                    <InputBox
                                        type={showApiKey ? "text" : "password"}
                                        value={lfmKey}
                                        onChange={(e) =>
                                            setLfmKey(e.currentTarget.value)
                                        }
                                        placeholder="Enter your Last.fm API Key"
                                    />
                                </div>
                                <Button
                                    palette="secondary"
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    style={{
                                        height: "38px",
                                        minWidth: "80px",
                                    }}>
                                    {showApiKey ? "Hide" : "Reveal"}
                                </Button>
                            </div>
                        </div>

                        <div>
                            <span style={labelStyle}>Last.fm Username</span>
                            <InputBox
                                value={lfmUser}
                                onChange={(e) =>
                                    setLfmUser(e.currentTarget.value)
                                }
                                placeholder="Enter your Last.fm Username"
                            />
                        </div>

                        <div>
                            <span style={labelStyle}>Discord User ID</span>
                            <InputBox
                                value={discordId}
                                onChange={(e) =>
                                    setDiscordId(e.currentTarget.value)
                                }
                                placeholder="Enter your Discord User ID"
                            />
                        </div>

                        <Tip palette="primary">
                            <strong>Note:</strong> to connect with Discord RPC
                            you need to join the{" "}
                            <a
                                href="https://discord.gg/GGEAxMANcT"
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                    color: "var(--accent)",
                                    textDecoration: "none",
                                }}>
                                Lanyard
                            </a>{" "}
                            Discord server
                        </Tip>

                        {hasChanges && (
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    marginTop: "4px",
                                }}>
                                <Button
                                    palette="accent"
                                    onClick={handleSave}
                                    disabled={isSaving}>
                                    {isSaving
                                        ? "Saving Configuration..."
                                        : "Save Settings"}
                                </Button>
                            </div>
                        )}
                    </Column>
                </section>
            </Column>
        </div>
    );
});
