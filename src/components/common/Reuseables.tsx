// Reuseable exports for Revite Revived, so I don't keep duplicating code in many places.
// Temporary solution until I'm not lazy and learn how to make the "External"'s be my own forks.

// Work around for slowmode until I make my own fork of "revolt.js"
export async function fetchSlowmode(
    channel: any,
    setSlowmode: (val: number) => void,
    setLoading?: (val: boolean) => void,
) {
    const channelId = channel.id || channel._id;
    if (!channelId) return;

    try {
        if (setLoading) setLoading(true);

        const rawData = await channel.client.api.get(
            `/channels/${channelId}` as any,
        );

        if (rawData && typeof rawData.slowmode !== "undefined") {
            setSlowmode(rawData.slowmode);
        } else {
            setSlowmode(0);
        }
    } catch (e) {
        console.error("Failed to fetch slowmode:", e);
        setSlowmode(0);
    } finally {
        if (setLoading) setLoading(false);
    }
}

// Normalization export
export const normalize = (str: string) => str.normalize("NFKC").toLowerCase();
