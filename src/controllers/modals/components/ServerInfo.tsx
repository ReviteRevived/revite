import { Flag, X } from "@styled-icons/boxicons-regular";
import { Text } from "preact-i18n";
import { Column, H1, IconButton, Modal, Row } from "@revoltchat/ui";
import { useApplicationState } from "../../../mobx/State";

import Markdown from "../../../components/markdown/Markdown";
import { useClient } from "../../client/ClientController";
import { modalController } from "../ModalController";
import { ModalProps } from "../types";

export default function ServerInfo({
    server,
    ...props
}: ModalProps<"server_info">) {
    const client = useClient();
    const isOwner = server.owner === client.user?._id;

    const state = useApplicationState();

    const hasUnreads = server.channel_ids.some((id) => {
        const channel = client.channels.get(id);
        return channel?.isUnread(state.notifications);
    });
    const actions = [];

    if (hasUnreads) {
        actions.push({
            onClick: () => {
                client.unreads?.markMultipleRead(server.channel_ids);
                server.ack();
                modalController.close();
                return true;
            },
            children: <Text id="app.context_menu.mark_as_read" />,
            palette: "primary",
        });
    }

    actions.push({
        onClick: () => {
            modalController.push({
                type: "server_identity",
                member: server.member!,
            });
            return true;
        },
        children: "Edit Identity",
        palette: "primary",
    });

    if (!isOwner) {
        actions.push({
            onClick: () => {
                modalController.push({
                    type: "leave_server",
                    target: server,
                });
                return true;
            },
            children: "Leave Server",
            palette: "error",
        });
    }

    const openReport = () => {
        modalController.push({
            type: "report",
            target: server,
        });
    };

    return (
        <Modal
            {...props}
            title={
                <Row centred gap="md">
                    <Column grow>
                        <H1>{server.name}</H1>
                    </Column>
                    <IconButton onClick={openReport}>
                        <Flag size={24} />
                    </IconButton>
                    <IconButton onClick={modalController.close}>
                        <X size={36} />
                    </IconButton>
                </Row>
            }
            actions={actions}>
            <Markdown content={server.description!} />
        </Modal>
    );
}
