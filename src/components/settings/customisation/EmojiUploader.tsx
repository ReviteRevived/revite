import { Server } from "revolt.js";

import { Text } from "preact-i18n";
import { useState } from "preact/hooks";

import { Button, Column, Form, FormElement, Row, Tip } from "@revoltchat/ui";

import { FileUploader } from "../../../controllers/client/jsx/legacy/FileUploads";

interface Props {
    server: Server;
}

export function EmojiUploader({ server }: Props) {
    const [fileId, setFileId] = useState<string>();
    const [emojiName, setEmojiName] = useState("");
    const [loading, setLoading] = useState(false);
    const [warning, setWarning] = useState<string | null>(null);

    const validate = (name: string) => {
        if (!name) return "Name is required.";
        if (name.length > 32) return "Name cannot exceed 32 characters.";
        if (/[A-Z]/.test(name)) return "Name must be lowercase.";
        if (/[^a-z0-9_]/.test(name))
            return "Only alphanumeric characters and underscores allowed.";
        return null;
    };

    return (
        <Column gap="normal">
            <h3>
                <Text id="app.settings.server_pages.emojis.upload" />
            </h3>

            {warning && <Tip palette="warning">{warning}</Tip>}

            <Form
                schema={{
                    name: "text",
                    file: "custom",
                }}
                data={{
                    name: {
                        field: "Name",
                        palette: "secondary",
                        value: emojiName,
                        onInput: (e: any) => {
                            const val = e.currentTarget.value;
                            setEmojiName(val);
                            const msg = validate(val);
                            setWarning(msg);
                        },
                    },
                    file: {
                        element: (
                            <FileUploader
                                style="icon"
                                width={100}
                                height={100}
                                fileType="emojis"
                                behaviour="upload"
                                previewAfterUpload
                                maxFileSize={500000}
                                remove={async () => {
                                    setFileId("");
                                    setWarning(null);
                                }}
                                onUpload={async (id) => {
                                    setFileId(id);
                                    setWarning(null);
                                }}
                            />
                        ),
                    },
                }}
                onSubmit={async () => {
                    const check = validate(emojiName);
                    if (check) {
                        setWarning(check);
                        return;
                    }

                    if (!fileId) {
                        setWarning("Please upload an image first.");
                        return;
                    }

                    setLoading(true);
                    try {
                        await server.client.api.put(`/custom/emoji/${fileId}`, {
                            name: emojiName,
                            parent: { type: "Server", id: server._id },
                        });

                        setFileId("");
                        setEmojiName("");
                        setWarning(null);
                    } catch (err: any) {
                        const errorType = err?.response?.data?.type;
                        if (errorType === "TooManyEmoji") {
                            setWarning(
                                "This server has reached its emoji limit.",
                            );
                        } else {
                            setWarning(
                                "Failed to create emoji. Ensure the name is unique.",
                            );
                        }
                    } finally {
                        setLoading(false);
                    }
                }}>
                <Row>
                    <FormElement id="file" />
                    <Column>
                        <FormElement id="name" />
                        <Button
                            type="submit"
                            palette="secondary"
                            disabled={
                                !fileId || !emojiName || !!warning || loading
                            }>
                            {loading ? (
                                "..."
                            ) : (
                                <Text id="app.special.modals.actions.save" />
                            )}
                        </Button>
                    </Column>
                </Row>
            </Form>
        </Column>
    );
}
