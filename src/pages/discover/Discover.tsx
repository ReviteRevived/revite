// This code, sucks. — It is also temporary just to add themes for now :)
// If you want to improve it, feel free. I know I made many mistales
// I'm superrrr sleep deprived tbh.

// EDIT - 3/02/26
// This code sucks even fucking more.
import { useState, useEffect, useMemo, useRef } from "react";
import { useHistory } from "react-router-dom";
import { observer } from "mobx-react-lite";
import {
    Compass,
    Palette,
    Server,
    Bot,
    Search,
    CheckShield,
    GridAlt,
    XCircle,
    LogOut,
} from "@styled-icons/boxicons-solid";

import { useApplicationState } from "../../mobx/State";
import { useClient } from "../../controllers/client/ClientController";
import { isTouchscreenDevice } from "../../lib/isTouchscreenDevice";
import styles from "./styles.module.scss";

const DISCOVERY_API_URL = "https://api.asraye.com/api";

const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const then = new Date(dateString);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
};

// Skeletons so things r pretty
const ThemeSkeleton = () => (
    <div className={`${styles.themeCard} ${styles.skeleton}`}>
        <div className={styles.previewContainer} />
        <div className={styles.cardContent}>
            <div
                className={styles.skeletonText}
                style={{ width: "70%", height: "1.2rem" }}
            />
            <div
                className={styles.skeletonText}
                style={{ width: "40%", height: "0.8rem", marginTop: "8px" }}
            />
        </div>
    </div>
);

export default observer(function Discover() {
    const history = useHistory();
    const client = useClient();
    const themeStore = useApplicationState().settings.theme;

    const [activeTab, setActiveTab] = useState<"themes" | "servers" | "bots">(
        "themes",
    );
    const [themes, setThemes] = useState<any[]>([]);
    const [servers, setServers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<
        "bumps" | "members" | "newest" | "activity"
    >("bumps");

    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const touchStartX = useRef<number | null>(null);

    const handleExit = () => {
        window.location.href = "/";
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null) return;
        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchStartX.current - touchEndX;

        if (diff > 50 && isSidebarOpen) {
            setSidebarOpen(false);
        }
        if (diff < -50 && !isSidebarOpen && touchStartX.current < 40) {
            setSidebarOpen(true);
        }
        touchStartX.current = null;
    };

    const handleJoin = async (serverId: string, inviteLink: string) => {
        try {
            if (client.servers.has(serverId)) {
                history.push(`/server/${serverId}`);
                return;
            }

            const code = inviteLink.split("/").pop() || inviteLink;
            await client.api.post(`/invites/${code as ""}`);

            let attempts = 0;
            while (!client.servers.has(serverId) && attempts < 10) {
                await new Promise((res) => setTimeout(res, 250));
                attempts++;
            }

            history.push(`/server/${serverId}`);
        } catch (e) {
            console.error("Failed to join server:", e);
            alert(
                "Could not join server. It might be full or the invite is invalid.",
            );
        }
    };

    useEffect(() => {
        setLoading(true);
        if (activeTab === "themes") {
            fetch(
                "https://raw.githubusercontent.com/revoltchat/themes/refs/heads/built/all.json",
            )
                .then((res) => res.json())
                .then((data) => {
                    const list = Object.entries(data).map(([slug, d]: any) => ({
                        slug,
                        ...d,
                    }));
                    setThemes(list);
                    setLoading(false);
                })
                .catch(() => setLoading(false));
        } else if (activeTab === "servers") {
            fetch(`${DISCOVERY_API_URL}/servers?sort=${sortBy}`)
                .then((res) => res.json())
                .then((data) => {
                    setServers(Array.isArray(data) ? data : []);
                    setLoading(false);
                })
                .catch(() => setLoading(false));
        }
    }, [activeTab, sortBy]);

    const groupedThemes = useMemo(() => {
        const filtered = themes.filter(
            (t) =>
                t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.creator?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.tags?.some((tag: string) =>
                    tag.toLowerCase().includes(searchQuery.toLowerCase()),
                ),
        );

        return {
            official: filtered.filter(
                (t) => t.creator?.toLowerCase() === "revolt",
            ),
            community: filtered.filter(
                (t) => t.creator?.toLowerCase() !== "revolt",
            ),
        };
    }, [themes, searchQuery]);

    const filteredServers = useMemo(() => {
        return servers.filter(
            (s) =>
                s.server_name
                    ?.toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                s.description
                    ?.toLowerCase()
                    .includes(searchQuery.toLowerCase()),
        );
    }, [servers, searchQuery]);

    // This below is the spawn of satan 👇
    const handleApply = (t: any) => {
        const source = t.variables || t;
        const isLight = source.light === true || t.tags?.includes("light");
        themeStore.setBase(isLight ? "light" : "dark");

        const metadata = [
            "name",
            "creator",
            "description",
            "slug",
            "tags",
            "light",
            "version",
            "css",
        ];
        const themePayload: any = {};

        const flatten = (obj: any, prefix = "") => {
            Object.keys(obj).forEach((key) => {
                const value = obj[key];
                const newKey = prefix ? `${prefix}-${key}` : key;
                if (
                    value &&
                    typeof value === "object" &&
                    !Array.isArray(value)
                ) {
                    flatten(value, newKey);
                } else if (!metadata.includes(newKey)) {
                    themePayload[newKey] = value;
                }
            });
        };

        flatten(source);
        // "Meet Thickman, a retired assassin... ensuring he stays sufficiently hydrated at all times". - Modest Pelican
        themeStore.hydrate(themePayload, true);
        const store = themeStore as any;
        (store.setCustomCSS || store.setCSS)?.(t.css || "");
    };

    const renderThemeCard = (t: any) => {
        const vars = t.variables || t;
        const isOfficial = t.creator?.toLowerCase() === "revolt";
        const displayTags = (t.tags || [])
            .filter((tag: string) => tag.toLowerCase() !== "theme")
            .slice(0, 3);

        return (
            <div className={styles.themeCard} key={t.slug}>
                <div
                    className={styles.previewContainer}
                    style={{
                        background: vars["primary-background"] || "#111",
                    }}>
                    <div
                        className={styles.mockSidebar}
                        style={{
                            background:
                                vars["secondary-background"] ||
                                "rgba(0,0,0,0.3)",
                        }}>
                        {[...Array(3)].map((_, i) => (
                            <div
                                key={i}
                                className={styles.mockCircle}
                                style={{
                                    background: vars["accent"] || "#fd6671",
                                    opacity: 0.5 - i * 0.1,
                                }}
                            />
                        ))}
                    </div>

                    <div
                        className={styles.mockChannelList}
                        style={{
                            background:
                                vars["secondary-background"] ||
                                "rgba(0,0,0,0.15)",
                        }}>
                        {[...Array(4)].map((_, i) => (
                            <div
                                key={i}
                                className={styles.mockChannelLine}
                                style={{
                                    width: i % 2 === 0 ? "70%" : "50%",
                                    background: vars["foreground"] || "#fff",
                                    opacity: 0.15,
                                }}
                            />
                        ))}
                    </div>

                    <div className={styles.mockContent}>
                        <div
                            className={styles.mockHeader}
                            style={{
                                background:
                                    vars["tertiary-background"] ||
                                    "rgba(0,0,0,0.1)",
                            }}
                        />
                        <div className={styles.mockChatLines}>
                            <div
                                className={styles.mockLine}
                                style={{
                                    width: "60%",
                                    background: vars["foreground"] || "#fff",
                                    opacity: 0.2,
                                }}
                            />
                            <div
                                className={styles.mockLine}
                                style={{
                                    width: "40%",
                                    background: vars["accent"] || "#fd6671",
                                }}
                            />
                            <div
                                className={styles.mockLine}
                                style={{
                                    width: "80%",
                                    background: vars["foreground"] || "#fff",
                                    opacity: 0.1,
                                }}
                            />
                        </div>
                    </div>

                    <div
                        className={styles.mockMemberList}
                        style={{
                            background:
                                vars["secondary-background"] ||
                                "rgba(0,0,0,0.15)",
                        }}>
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className={styles.mockMemberItem}>
                                <div
                                    className={styles.mockAvatar}
                                    style={{
                                        background: vars["accent"] || "#fd6671",
                                        opacity: 0.3,
                                    }}
                                />
                                <div
                                    className={styles.mockMemberLine}
                                    style={{
                                        background:
                                            vars["foreground"] || "#fff",
                                        opacity: 0.1,
                                    }}
                                />
                            </div>
                        ))}
                    </div>

                    <div className={styles.badgeOverlay}>
                        {t.version && (
                            <span className={styles.versionBadge}>
                                v{t.version}
                            </span>
                        )}
                        {isOfficial && (
                            <CheckShield
                                size={14}
                                className={styles.officialIcon}
                                style={{ color: vars["accent"] || "#fd6671" }}
                            />
                        )}
                    </div>
                </div>

                <div className={styles.cardContent}>
                    <div className={styles.themeHeader}>
                        <div className={styles.themeInfo}>
                            <h3>{t.name}</h3>
                            <p>
                                by <span>{t.creator}</span>
                            </p>
                        </div>
                        <button
                            className={styles.applyButton}
                            onClick={() => handleApply(t)}>
                            Apply
                        </button>
                    </div>

                    <div className={styles.tagList}>
                        {displayTags.map((tag: string) => (
                            <span key={tag} className={styles.tag}>
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderServerCard = (s: any) => (
        <div className={styles.themeCard} key={s.server_id}>
            <div
                className={styles.previewContainer}
                style={{
                    backgroundImage: s.banner_url
                        ? `url(${s.banner_url})`
                        : "none",
                    backgroundColor: "var(--secondary-background)",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    height: "100px",
                    position: "relative",
                }}>
                <div
                    style={{
                        position: "absolute",
                        top: "8px",
                        left: "8px",
                        zIndex: 2,
                    }}>
                    <span
                        className={styles.versionBadge}
                        style={{
                            background: "rgba(0,0,0,0.6)",
                            backdropFilter: "blur(4px)",
                        }}>
                        Bumped {formatTimeAgo(s.last_bumped)}
                    </span>
                </div>
                <div className={styles.badgeOverlay}>
                    {s.is_verified === 1 && (
                        <CheckShield
                            size={16}
                            style={{ color: "#43b581", marginRight: "4px" }}
                        />
                    )}
                    <span className={styles.versionBadge}>
                        {s.members?.toLocaleString() || 0} Members
                    </span>
                </div>
            </div>
            <div className={styles.cardContent}>
                <div
                    className={styles.serverHeader}
                    style={{
                        display: "flex",
                        gap: "12px",
                        alignItems: "center",
                    }}>
                    <div
                        className={styles.serverIconWrapper}
                        style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "12px",
                            overflow: "hidden",
                            backgroundColor: "var(--tertiary-background)",
                            flexShrink: 0,
                        }}>
                        {s.icon_url ? (
                            <img
                                src={s.icon_url}
                                alt=""
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                }}
                            />
                        ) : (
                            <Server
                                size={24}
                                style={{ opacity: 0.5, margin: "12px" }}
                            />
                        )}
                    </div>
                    <div
                        className={styles.themeInfo}
                        style={{ flex: 1, overflow: "hidden" }}>
                        <h3
                            style={{
                                margin: 0,
                                fontSize: "0.95rem",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}>
                            {s.server_name}
                        </h3>
                        <p
                            style={{
                                margin: 0,
                                fontSize: "0.75rem",
                                opacity: 0.6,
                            }}>
                            by{" "}
                            <span style={{ color: "var(--accent)" }}>
                                {s.owner || "Unknown"}
                            </span>
                        </p>
                    </div>
                </div>
                <p
                    className={styles.serverDescription}
                    style={{
                        fontSize: "0.85rem",
                        marginTop: "10px",
                        height: "2.8em",
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        opacity: 0.8,
                    }}>
                    {s.description || "No description provided."}
                </p>
                <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                    <button
                        className={styles.applyButton}
                        style={{ flex: 1 }}
                        onClick={() => handleJoin(s.server_id, s.invite_link)}>
                        Join
                    </button>
                    <div
                        style={{
                            padding: "0 10px",
                            borderRadius: "8px",
                            background: "var(--secondary-background)",
                            display: "flex",
                            alignItems: "center",
                            fontSize: "0.7rem",
                            fontWeight: "bold",
                            border: "1px dashed var(--accent)",
                            opacity: 0.7,
                        }}
                        title="Activity tracking coming soon!">
                        Activity: WIP
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div
            className={`${styles.discoverLayout} ${isTouchscreenDevice ? styles.touchscreen : ""}`} // Everyone should use a PC, so I don't have to worry about this.
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}>
            {isSidebarOpen && isTouchscreenDevice && (
                <div
                    className={styles.sidebarOverlay}
                    onClick={() => setSidebarOpen(false)}
                />
            )}
            <div
                className={`${styles.sideNav} ${isSidebarOpen ? styles.isOpen : ""}`}>
                {isTouchscreenDevice && (
                    <div
                        className={styles.mobileClose}
                        onClick={() => setSidebarOpen(false)}>
                        <XCircle size={24} />
                    </div>
                )}

                <div
                    className={styles.navItem}
                    data-active={activeTab === "themes"}
                    onClick={() => {
                        setActiveTab("themes");
                        setSidebarOpen(false);
                    }}>
                    <Palette size={20} /> Themes
                </div>
                <div
                    className={styles.navItem}
                    data-active={activeTab === "servers"}
                    onClick={() => {
                        setActiveTab("servers");
                        setSidebarOpen(false);
                    }}>
                    <Server size={20} /> Servers
                </div>
                <div className={`${styles.navItem} ${styles.disabled}`}>
                    <Bot size={20} /> Bots {/* For the teasing :trol: */}
                </div>

                <div
                    className={styles.navExit}
                    onClick={handleExit}
                    style={{
                        marginTop: "auto",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "15px",
                    }}>
                    <LogOut size={20} /> Exit
                </div>
            </div>

            <div className={styles.mainContent}>
                {isTouchscreenDevice && (
                    <div className={styles.mobileHeader}>
                        <GridAlt
                            size={28}
                            onClick={() => setSidebarOpen(true)}
                            style={{ cursor: "pointer" }}
                        />
                    </div>
                )}

                <div className={styles.heroSection}>
                    <div className={styles.iconCircle}>
                        <Compass size={32} color="white" />
                    </div>
                    <div className={styles.heroText}>
                        <div className={styles.heroTitle}>
                            Community Discovery
                        </div>
                        {/* They didn't give me access :( */}
                        <div className={styles.heroSubtitle}>
                            Developing {activeTab} discovery in my free-time.
                        </div>
                    </div>
                </div>

                <div className={styles.toolbar}>
                    <div className={styles.searchWrapper}>
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder={`Search ${activeTab}...`}
                            value={searchQuery}
                            onChange={(e) =>
                                setSearchQuery(e.currentTarget.value)
                            }
                        />
                    </div>
                </div>

                <div className={styles.themeGrid}>
                    {loading
                        ? Array.from({ length: 8 }).map((_, i) => (
                              <ThemeSkeleton key={i} />
                          ))
                        : activeTab === "themes"
                          ? [
                                ...groupedThemes.official,
                                ...groupedThemes.community,
                            ].map(renderThemeCard)
                          : filteredServers.map(renderServerCard)}
                </div>
            </div>
        </div>
    );
});
