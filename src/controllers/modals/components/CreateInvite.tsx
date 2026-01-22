import styled from "styled-components";
import { Text } from "preact-i18n";
import { useEffect, useState } from "preact/hooks";

import { ModalForm, Button } from "@revoltchat/ui";

import { noopAsync } from "../../../lib/js";

import { takeError } from "../../client/jsx/error";
import { modalController } from "../ModalController";
import { ModalProps } from "../types";
import { Skeleton } from "../../../components/ui/Skeleton";

const InviteContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
`;

const InviteField = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;

    label {
        font-size: 0.65rem;
        font-weight: 700;
        text-transform: uppercase;
        opacity: 0.5;
        margin-left: 2px;
    }

    .input-group {
        display: flex;
        gap: 8px;
        min-height: 38px;

        @media screen and (max-width: 600px) {
            flex-direction: column;
            height: auto;
        }
    }

    input {
        flex-grow: 1;
        background: var(--background-darkest);
        color: var(--foreground);
        border: 1px solid var(--border);
        padding: 8px 12px;
        border-radius: 6px;
        font-family: var(--monospace-font);
        font-size: 0.85rem;
        cursor: pointer;
        transition: border 0.2s ease;
        min-width: 0; /* Prevents input from pushing out of flex container */

        &:focus {
            outline: none;
            border-color: var(--accent);
        }
    }

    button {
        @media screen and (max-width: 600px) {
            width: 100%;
        }
    }
`;

const SecondaryLinks = styled.details`
    margin-top: 8px;
    border-top: 1px solid var(--border);
    padding-top: 8px;

    summary {
        cursor: pointer;
        font-size: 0.75rem;
        font-weight: 600;
        opacity: 0.6;
        list-style: none;
        user-select: none;
        padding: 6px;
        text-align: center;
        transition: opacity 0.2s;

        &:hover {
            opacity: 1;
        }
        &::-webkit-details-marker {
            display: none;
        }
    }

    .content {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding-top: 12px;
    }
`;

const SkeletonButton = styled(Skeleton.Item)`
    width: 60px;
    height: 38px;
    border-radius: 6px;
    background: var(--primary-header);
    opacity: 0.1;

    @media screen and (max-width: 600px) {
        width: 100%;
    }
`;

/**
 * Create invite modal
 */
export default function CreateInvite({
    target,
    ...props
}: ModalProps<"create_invite">) {
    const [processing, setProcessing] = useState(false);
    const [code, setCode] = useState("");

    useEffect(() => {
        setProcessing(true);
        target
            .createInvite()
            .then(({ _id }) => setCode(_id))
            .catch((err) =>
                modalController.push({ type: "error", error: takeError(err) }),
            )
            .finally(() => setProcessing(false));
    }, [target]);

    const copyToClipboard = (text: string) => {
        modalController.writeText(text);
    };

    const links = {
        main: {
            label: "App Link",
            url: `${window.location.host}/invite/${code}`,
        },
        alternatives: [
            { label: "rvlt.gg", url: `https://rvlt.gg/${code}` },
            { label: "stt.gg", url: `https://stt.gg/${code}` },
        ],
    };

    const renderField = (link: { label: string; url: string }) => (
        <InviteField key={link.label}>
            <label>{link.label}</label>
            <div className="input-group">
                {processing || !code ? (
                    <>
                        <Skeleton.Item
                            style={{
                                flexGrow: 1,
                                height: "38px",
                                borderRadius: "6px",
                                background: "var(--primary-header)",
                                opacity: 0.1,
                            }}
                        />
                        <SkeletonButton />
                    </>
                ) : (
                    <>
                        <input
                            type="text"
                            readOnly
                            value={link.url}
                            onClick={(e: any) => e.target.select()}
                        />
                        <Button
                            variant="contrast"
                            onClick={() => copyToClipboard(link.url)}>
                            Copy
                        </Button>
                    </>
                )}
            </div>
        </InviteField>
    );

    return (
        <ModalForm
            {...props}
            title={<Text id={`app.context_menu.create_invite`} />}
            schema={{ message: "custom" }}
            data={{
                message: {
                    element: (
                        <InviteContainer>
                            <Text id="app.special.modals.prompt.create_invite_created" />

                            {renderField(links.main)}

                            <SecondaryLinks>
                                <summary>More Links</summary>
                                <div className="content">
                                    {links.alternatives.map(renderField)}
                                </div>
                            </SecondaryLinks>
                        </InviteContainer>
                    ),
                },
            }}
            callback={noopAsync}
            submit={{
                children: <Text id="app.special.modals.actions.ok" />,
            }}
        />
    );
}
