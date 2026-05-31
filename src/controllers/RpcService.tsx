/* eslint-disable @typescript-eslint/no-explicit-any */
import { makeAutoObservable, runInAction } from "mobx";

export interface ActiveTrack {
    title: string;
    artist: string;
    albumArt: string;
    source: string;
}

export interface ActiveGame {
    name: string;
    details: string;
    state: string;
    largeImage: string;
}

class RpcService {
    activeTrack: ActiveTrack | null = null;
    activeGame: ActiveGame | null = null;
    isSyncPaused = false;
    isRefreshing = false;

    private intervalId: NodeJS.Timeout | null = null;
    private currentBroadcastSignature = "";
    private settingsStore: any;
    private client: any = null;

    private lastRotationTime = 0;
    private rotationTarget: "music" | "games" = "music";

    private cachedCustomStatus: string | undefined = undefined;
    private hasCachedOriginalStatus = false;

    constructor() {
        makeAutoObservable(this, {}, { autoBind: true });
    }

    init(settingsStore: any, client: any) {
        this.settingsStore = settingsStore;
        this.client = client;
        this.isSyncPaused = settingsStore.get("rpc:is_paused", false);

        if (!this.isSyncPaused) {
            this.startLoop();
        }
    }

    startLoop() {
        this.stopLoop();
        this.syncRPC();
        this.intervalId = setInterval(() => this.syncRPC(), 10000);
    }

    stopLoop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    async togglePause() {
        this.isSyncPaused = !this.isSyncPaused;
        this.settingsStore.set("rpc:is_paused", this.isSyncPaused);

        if (this.isSyncPaused) {
            this.stopLoop();
            runInAction(() => {
                this.activeTrack = null;
                this.activeGame = null;
                this.currentBroadcastSignature = "";
            });

            const statusToRestore = this.cachedCustomStatus ?? "";
            await this.pushStatusToStoat(statusToRestore);

            this.cachedCustomStatus = undefined;
            this.hasCachedOriginalStatus = false;
        } else {
            this.startLoop();
        }
    }

    async forceRefresh() {
        if (this.isSyncPaused || this.isRefreshing) return;

        runInAction(() => {
            this.isRefreshing = true;
        });
        await this.syncRPC();
        this.startLoop();

        setTimeout(() => {
            runInAction(() => {
                this.isRefreshing = false;
            });
        }, 1000);
    }

    private async syncRPC() {
        if (this.isSyncPaused || !this.settingsStore) return;

        const discordId = this.settingsStore.get("rpc:discord_user_id", "");
        const lfmKey = this.settingsStore.get("rpc:lastfm_api_key", "");
        const lfmUser = this.settingsStore.get("rpc:lastfm_username", "");

        const priority = this.settingsStore.get("rpc:priority", "rotate");

        let detectedTrack: ActiveTrack | null = null;
        let detectedGame: ActiveGame | null = null;

        if (discordId) {
            try {
                const res = await fetch(
                    `https://api.lanyard.rest/v1/users/${discordId}`,
                );
                if (res.ok) {
                    const { data } = await res.json();

                    if (data.listening_to_spotify && data.spotify) {
                        detectedTrack = {
                            title: data.spotify.track,
                            artist: data.spotify.artist,
                            albumArt: data.spotify.album_art_url,
                            source: "Spotify via Discord",
                        };
                    }

                    if (data.activities && data.activities.length > 0) {
                        const gameActivity = data.activities.find(
                            (act: any) => act.type === 0,
                        );
                        if (gameActivity) {
                            detectedGame = {
                                name: gameActivity.name,
                                details: gameActivity.details || "",
                                state: gameActivity.state || "",
                                largeImage: gameActivity.assets?.large_image
                                    ? `https://cdn.discordapp.com/app-assets/${gameActivity.application_id}/${gameActivity.assets.large_image}.png`
                                    : "",
                            };
                        }
                    }
                }
            } catch (e) {
                console.error("Lanyard:", e);
            }
        }

        if (!detectedTrack && lfmKey && lfmUser) {
            try {
                const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${lfmUser}&api_key=${lfmKey}&format=json&limit=1`;
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    const currentTrack = data.recenttracks?.track?.[0];
                    if (
                        currentTrack &&
                        currentTrack["@attr"]?.nowplaying === "true"
                    ) {
                        detectedTrack = {
                            title: currentTrack.name,
                            artist:
                                currentTrack.artist?.["#text"] ||
                                "Unknown Artist",
                            albumArt: currentTrack.image?.[2]?.["#text"] || "",
                            source: "Last.fm Scrobbler",
                        };
                    }
                }
            } catch (e) {
                console.error("Last.fm:", e);
            }
        }

        runInAction(() => {
            this.activeTrack = detectedTrack;
            this.activeGame = detectedGame;
        });

        let effectivePriority = priority;
        if (priority === "rotate") {
            const now = Date.now();
            if (now - this.lastRotationTime >= 300000) {
                this.rotationTarget =
                    this.rotationTarget === "music" ? "games" : "music";
                this.lastRotationTime = now;
            }
            effectivePriority = this.rotationTarget;
        }

        let targetedSignature = "";
        let statusPayloadText = "";

        const useTrack =
            effectivePriority === "games"
                ? detectedTrack && !detectedGame
                : detectedTrack;
        const useGame =
            effectivePriority === "games"
                ? detectedGame
                : detectedGame && !detectedTrack;

        if (useTrack && detectedTrack) {
            targetedSignature = `🎵 ${detectedTrack.title} - ${detectedTrack.artist}`;
            statusPayloadText = `🎶 ${detectedTrack.title} - ${detectedTrack.artist}`;
        } else if (useGame && detectedGame) {
            targetedSignature = `🎮 ${detectedGame.name}`;
            statusPayloadText = `🎮 ${detectedGame.name} ${
                detectedGame.details ? `(${detectedGame.details})` : ""
            }`;
        }

        if (this.currentBroadcastSignature !== targetedSignature) {
            if (!this.hasCachedOriginalStatus && this.client?.user) {
                this.cachedCustomStatus = this.client.user.status?.text || "";
                this.hasCachedOriginalStatus = true;
            }

            this.currentBroadcastSignature = targetedSignature;

            await this.pushStatusToStoat(
                statusPayloadText || this.cachedCustomStatus || "",
            );
        }
    }

    private async pushStatusToStoat(text: string) {
        try {
            if (this.client?.users) {
                const trimmedText = text.trim();
                await this.client.users.edit({
                    status: {
                        ...this.client.user?.status,
                        text: trimmedText.length > 0 ? trimmedText : undefined,
                        presence: "Online",
                    },
                });
            }
        } catch (err) {
            console.error("Failed pushing status back to Stoat:", err);
        }
    }
}

export const rpcService = new RpcService();
