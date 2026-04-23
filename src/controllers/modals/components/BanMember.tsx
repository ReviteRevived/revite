import { Text } from "preact-i18n";

import { Column, ModalForm } from "@revoltchat/ui";

import UserIcon from "../../../components/common/user/UserIcon";
import { ModalProps } from "../types";

/**
 * Ban member modal
 */
export default function BanMember({
    member,
    ...props
}: ModalProps<"ban_member">) {
    return (
        <ModalForm
            {...props}
            title={<Text id={`app.context_menu.ban_member`} />}
            schema={{
                member: "custom",
                reason: "text",
                days: "combo",
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
                    field: "Clear Message History",
                    options: [
                        { value: "0", name: "Don't delete any" },
                        { value: "0.0416", name: "Past Hour" },
                        { value: "0.25", name: "Past 6 Hours" },
                        { value: "0.5", name: "Past 12 Hours" },
                        { value: "1", name: "Past 24 Hours" },
                        { value: "3", name: "Past 3 Days" },
                        { value: "7", name: "Past 7 Days" },
                    ],
                },
            }}
            callback={async ({ reason, days }) => {
                const dayCount = parseFloat((days as string) || "0");
                const delete_message_seconds = Math.floor(dayCount * 86400);

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
