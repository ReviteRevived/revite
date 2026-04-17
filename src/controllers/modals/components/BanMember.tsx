import { Text } from "preact-i18n";
import { useRef } from "preact/hooks";

import { Column, ModalForm, Category } from "@revoltchat/ui";

import UserIcon from "../../../components/common/user/UserIcon";
import { ModalProps } from "../types";

/**
 * Ban member modal
 */
export default function BanMember({
    member,
    ...props
}: ModalProps<"ban_member">) {
    const selectRef = useRef<HTMLSelectElement>(null); // Hackfix

    return (
        <ModalForm
            {...props}
            title={<Text id={`app.context_menu.ban_member`} />}
            schema={{
                member: "custom",
                reason: "text",
                days: "custom",
            }}
            data={{
                member: {
                    element: (
                        <Column centred>
                            <UserIcon target={member.user} size={64} />
                            <Text
                                id="app.special.modals.prompt.confirm_ban"
                                fields={{ name: member.user?.username }}
                            />
                        </Column>
                    ),
                },
                reason: {
                    field: (
                        <Text id="app.special.modals.prompt.confirm_ban_reason" />
                    ) as React.ReactChild,
                },
                days: {
                    element: (
                        <Column gap="sm">
                            <Category compact>Clear Message History</Category>
                            <select
                                ref={selectRef}
                                style={{
                                    width: "100%",
                                    padding: "8px",
                                    borderRadius: "var(--border-radius)",
                                    background: "var(--secondary-background)",
                                    color: "var(--foreground)",
                                    border: "1px solid var(--border)",
                                }}
                                defaultValue="0">
                                <option value="0">Don't delete any</option>
                                <option value="0.0416">Past Hour</option>
                                <option value="0.25">Past 6 Hours</option>
                                <option value="0.5">Past 12 Hours</option>
                                <option value="1">Past 24 Hours</option>
                                <option value="3">Past 3 Days</option>
                                <option value="7">Past 7 Days</option>
                            </select>
                        </Column>
                    ),
                },
            }}
            callback={async ({ reason }) => {
                const days = parseFloat(selectRef.current?.value || "0");
                const delete_message_seconds = Math.floor(days * 86400);

                const serverId =
                    member.server?._id || (member as any)._id?.server;
                const userId = member.user?._id || (member as any)._id?.user;

                const payload = {
                    reason,
                    delete_message_seconds,
                };

                await (member.client.api as any).put(
                    `/servers/${serverId}/bans/${userId}`,
                    payload,
                );
            }}
            submit={{
                palette: "error",
                children: <Text id="app.special.modals.actions.ban" />,
            }}
        />
    );
}
