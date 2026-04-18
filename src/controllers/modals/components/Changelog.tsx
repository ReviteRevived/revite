import dayjs from "dayjs";
import styled, { css } from "styled-components";

import { Text } from "preact-i18n";
import { useMemo, useState, useEffect } from "preact/hooks";

import { CategoryButton, Column, Modal } from "@revoltchat/ui";
import type { Action } from "@revoltchat/ui/esm/components/design/atoms/display/Modal";

import { noopTrue } from "../../../lib/js";

import { fetchUpdates, ChangelogPost } from "../../../assets/changelogs";
import Markdown from "../../../components/markdown/Markdown";
import { ModalProps } from "../types";

const Image = styled.img<{ shadow?: boolean }>`
    border-radius: var(--border-radius);

    ${(props) =>
        props.shadow &&
        css`
            filter: drop-shadow(4px 4px 10px rgba(0, 0, 0, 0.5));
        `}
`;

const SectionHeader = styled.div`
    font-weight: bold;
    text-transform: uppercase;
    font-size: 0.75rem;
    margin: 15px 0 5px 10px;
    opacity: 0.5;
    letter-spacing: 1px;

    &:first-child {
        margin-top: 0;
    }
`;

function RenderLog({ post }: { post: ChangelogPost }) {
    return (
        <Column>
            {post.content.map((entry) =>
                typeof entry === "string" ? (
                    <Markdown content={entry} />
                ) : entry.type === "element" ? (
                    entry.element
                ) : (
                    <Image src={entry.src} shadow={entry.shadow} />
                ),
            )}
        </Column>
    );
}

/**
 * Changelog modal
 */
export default function Changelog({
    onClose,
    signal,
}: ModalProps<"changelog">) {
    const [data, setData] = useState<Record<string, ChangelogPost[]>>({
        feat: [],
        fix: [],
        chore: [],
    });
    const [selectedEntry, setSelectedEntry] = useState<
        ChangelogPost | undefined
    >(undefined);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUpdates().then((res) => {
            setData(res);
            setLoading(false);
        });
    }, []);

    const actions = useMemo(() => {
        const arr: Action[] = [
            {
                palette: "primary",
                children: <Text id="app.special.modals.actions.close" />,
                onClick: noopTrue,
            },
        ];

        if (selectedEntry) {
            arr.push({
                palette: "plain-secondary",
                children: <Text id="app.special.modals.changelogs.older" />,
                onClick: () => {
                    setSelectedEntry(undefined);
                    return false;
                },
            });
        }

        return arr;
    }, [selectedEntry]);

    return (
        <Modal
            title={
                selectedEntry?.title ?? (
                    <Text id="app.special.modals.changelogs.title" />
                )
            }
            description={
                selectedEntry ? (
                    dayjs(selectedEntry.date).calendar()
                ) : (
                    <Text id="app.special.modals.changelogs.description" />
                )
            }
            actions={actions}
            onClose={onClose}
            signal={signal}>
            {loading ? (
                <div style={{ padding: "20px", textAlign: "center" }}>
                    <Text id="app.special.modals.changelogs.loading" />
                </div>
            ) : selectedEntry ? (
                <RenderLog post={selectedEntry} />
            ) : (
                <Column gap="none">
                    {data.feat.length > 0 && (
                        <>
                            <SectionHeader>Features</SectionHeader>
                            {data.feat.map((post, index) => (
                                <CategoryButton
                                    key={`feat-${index}`}
                                    onClick={() => setSelectedEntry(post)}>
                                    {post.title}
                                </CategoryButton>
                            ))}
                        </>
                    )}

                    {data.fix.length > 0 && (
                        <>
                            <SectionHeader>Bug Fixes</SectionHeader>
                            {data.fix.map((post, index) => (
                                <CategoryButton
                                    key={`fix-${index}`}
                                    onClick={() => setSelectedEntry(post)}>
                                    {post.title}
                                </CategoryButton>
                            ))}
                        </>
                    )}

                    {data.chore.length > 0 && (
                        <>
                            <SectionHeader>Maintenance</SectionHeader>
                            {data.chore.map((post, index) => (
                                <CategoryButton
                                    key={`chore-${index}`}
                                    onClick={() => setSelectedEntry(post)}>
                                    {post.title}
                                </CategoryButton>
                            ))}
                        </>
                    )}
                </Column>
            )}
        </Modal>
    );
}
