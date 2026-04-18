import { JSX } from "preact";

export type Element =
    | string
    | {
          type: "image";
          src: string;
          shadow?: boolean;
      }
    | { type: "element"; element: JSX.Element };

export interface ChangelogPost {
    date: Date;
    title: string;
    content: Element[];
}

function toTitleCase(str: string): string {
    return str
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

const REPO = "ReviteRevived/revite";

// Fetches and categorizes GitHub commits
export async function fetchUpdates(): Promise<Record<string, ChangelogPost[]>> {
    try {
        const response = await fetch(
            `https://api.github.com/repos/${REPO}/commits?per_page=100`,
        );
        if (!response.ok) throw new Error("GitHub fetch failed");

        const commits = await response.json();
        const categories: Record<string, ChangelogPost[]> = {
            feat: [],
            fix: [],
            chore: [],
        };

        for (const item of commits) {
            const msg = item.commit.message;
            const firstLine = msg.split("\n")[0].toLowerCase();

            let type: "feat" | "fix" | "chore" | null = null;
            if (firstLine.startsWith("feat")) type = "feat";
            else if (firstLine.startsWith("fix")) type = "fix";
            else if (firstLine.startsWith("chore")) type = "chore";

            if (type && categories[type].length < 10) {
                const cleanedTitle = msg
                    .split("\n")[0]
                    .replace(/^(feat|fix|chore)(\(.+\))?!?: /, "");

                categories[type].push({
                    date: new Date(item.commit.author.date),
                    title: toTitleCase(cleanedTitle),
                    content: [
                        msg,
                        {
                            type: "element",
                            element: (
                                <a
                                    href={item.html_url}
                                    target="_blank"
                                    rel="noreferrer">
                                    Read more on GitHub
                                </a>
                            ),
                        },
                    ],
                });
            }
        }
        return categories;
    } catch (e) {
        console.error("Changelog fetch error:", e);
        return { feat: [], fix: [], chore: [] };
    }
}

// Shut errors up by having these here
export const changelogEntries: Record<number, ChangelogPost> = {};
export const changelogEntryArray: ChangelogPost[] = [];
export const latestChangelog = 0;
