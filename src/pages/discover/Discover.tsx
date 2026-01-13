// This code, sucks. — It is also temporary just to add themes for now :)
// If you want to improve it, feel free. I know I made many mistales
// I'm superrrr sleep deprived tbh.
import { useState, useEffect, useMemo } from "react";
import {
    Compass,
    Palette,
    Server,
    Bot,
    Search,
    CheckShield,
    Exit,
} from "@styled-icons/boxicons-solid";
import { observer } from "mobx-react-lite";
import { useApplicationState } from "../../mobx/State";
import { isTouchscreenDevice } from "../../lib/isTouchscreenDevice";
import styles from "./styles.module.scss";

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
    const themeStore = useApplicationState().settings.theme;
    const [themes, setThemes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
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
    }, []);

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

        if (t.css) {
            (themeStore as any).setCustomCSS?.(t.css) ||
                (themeStore as any).setCSS?.(t.css);
        } else {
            // Idrk what this does when I wrote it, but I know if I remove it, everything breaks.
            (themeStore as any).setCustomCSS?.("") ||
                (themeStore as any).setCSS?.("");
        }
    };

    // TODO: Fix theme card, this looks SO BADDD...
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
                        background:
                            vars["primary-background"] ||
                            vars["background"] ||
                            "#111",
                    }}>
                    <div
                        className={styles.mockSidebar}
                        style={{
                            background:
                                vars["secondary-background"] ||
                                "rgba(0,0,0,0.2)",
                        }}
                    />
                    <div className={styles.mockContent}>
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
                                width: "70%",
                                opacity: 0.1,
                                background: vars["foreground"] || "#fff",
                            }}
                        />
                    </div>
                    {t.version && (
                        <div className={styles.versionBadge}>v{t.version}</div>
                    )}
                </div>
                <div className={styles.cardContent}>
                    <div className={styles.themeInfo}>
                        <h3>
                            {t.name}{" "}
                            {isOfficial && (
                                <CheckShield
                                    size={16}
                                    style={{
                                        color: "var(--accent)",
                                        marginLeft: 4,
                                    }}
                                />
                            )}
                        </h3>
                        <p>by: {t.creator}</p>
                        <div className={styles.tagList}>
                            {displayTags.map((tag: string) => (
                                <span key={tag} className={styles.tag}>
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                    <button
                        className={styles.applyButton}
                        onClick={() => handleApply(t)}>
                        Apply
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div
            className={`${styles.discoverLayout} ${
                isTouchscreenDevice ? styles.touchscreen : "" // Everyone should use a PC, so I don't have to worry about this.
            }`}>
            <div className={styles.sideNav}>
                <div className={styles.navItem} data-active="true">
                    <Palette size={20} /> Themes
                </div>
                <div className={`${styles.navItem} ${styles.disabled}`}>
                    <Server size={20} /> Servers {/* For the teasing :trol: */}
                </div>
                <div className={`${styles.navItem} ${styles.disabled}`}>
                    <Bot size={20} /> Bots {/* For the teasing :trol: */}
                </div>
            </div>

            <div className={styles.mainContent}>
                <div className={styles.heroSection}>
                    <button
                        className={styles.closeButton}
                        onClick={() => {
                            window.history.back();
                        }}>
                        <Exit size={24} />
                    </button>
                    <div className={styles.iconCircle}>
                        <Compass size={32} color="white" />
                    </div>
                    <div className={styles.heroText}>
                        <div className={styles.heroTitle}>
                            Community Discovery
                        </div>
                        {/* They should give me access frfr */}
                        <div className={styles.heroSubtitle}>
                            Building this in my free-time since official
                            discovery is currently blocked on third-party
                            clients.
                        </div>
                    </div>
                </div>

                <div className={styles.toolbar}>
                    <div className={styles.searchWrapper}>
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search themes or #tags..."
                            value={searchQuery}
                            onChange={(e) =>
                                setSearchQuery(e.currentTarget.value)
                            }
                        />
                    </div>
                </div>

                {loading ? (
                    <div className={styles.themeGrid}>
                        {Array.from({ length: 8 }).map((_, i) => (
                            <ThemeSkeleton key={i} />
                        ))}
                    </div>
                ) : (
                    <>
                        {/* This likes to whine about children.. Idk, I think they lost custody? */}
                        {groupedThemes.official.length > 0 && (
                            <section className={styles.sectionWrapper}>
                                <h2 className={styles.sectionTitle}>
                                    Official Themes {/* Stinky themes */}
                                </h2>
                                <div className={styles.themeGrid}>
                                    {groupedThemes.official.map(
                                        renderThemeCard,
                                    )}
                                </div>
                            </section>
                        )}
                        <section className={styles.sectionWrapper}>
                            <h2 className={styles.sectionTitle}>
                                Community Themes {/* Peak themes */}
                            </h2>
                            <div className={styles.themeGrid}>
                                {groupedThemes.community.map(renderThemeCard)}
                            </div>
                        </section>
                    </>
                )}
            </div>
        </div>
    );
});
