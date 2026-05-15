import { ListUl, Trash } from "@styled-icons/boxicons-regular";
import { InfoCircle } from "@styled-icons/boxicons-solid";
import { observer } from "mobx-react-lite";
import { Route, Switch, useHistory, useParams } from "react-router-dom";

import { Text } from "preact-i18n";
import { useEffect } from "preact/hooks";

import { useClient } from "../../controllers/client/ClientController";
import { ChannelName } from "../../controllers/client/jsx/ChannelName";
import { modalController } from "../../controllers/modals/ModalController";
import { GenericSettings } from "./GenericSettings";
import Overview from "./channel/Overview";
import Permissions from "./channel/Permissions";

export default observer(() => {
    const { channel: cid, server: sid } =
        useParams<{ channel: string; server?: string }>();

    const client = useClient();
    const history = useHistory();
    const channel = client.channels.get(cid);

    useEffect(() => {
        if (!channel) {
            history.replace(sid ? `/server/${sid}` : "/");
        }
    }, [channel, history, sid]);

    if (!channel) return null;

    if (
        channel.channel_type === "SavedMessages" ||
        channel.channel_type === "DirectMessage"
    )
        return null;

    const canDelete = channel.server
        ? channel.server.havePermission("ManageChannel")
        : null;

    function switchPage(to?: string) {
        let base_url;
        switch (channel?.channel_type) {
            case "TextChannel":
            case "VoiceChannel":
                base_url = `/server/${channel.server_id}/channel/${cid}/settings`;
                break;
            default:
                base_url = `/channel/${cid}/settings`;
        }

        if (to) {
            history.replace(`${base_url}/${to}`);
        } else {
            history.replace(base_url);
        }
    }

    return (
        <GenericSettings
            pages={[
                {
                    category: <ChannelName channel={channel} prefix />,
                    id: "overview",
                    icon: <InfoCircle size={20} />,
                    title: (
                        <Text id="app.settings.channel_pages.overview.title" />
                    ),
                },
                {
                    id: "permissions",
                    icon: <ListUl size={20} />,
                    title: (
                        <Text id="app.settings.channel_pages.permissions.title" />
                    ),
                    divider: true,
                },
                ...(canDelete
                    ? [
                          {
                              id: "delete_channel",
                              icon: <Trash size={20} />,
                              title: (
                                  <Text id="app.settings.channel_pages.delete">
                                      Delete Channel
                                  </Text>
                              ),
                              palette: "error",
                              action: () => {
                                  modalController.push({
                                      type: "delete_channel",
                                      target: channel,
                                  });
                              },
                          },
                      ]
                    : []),
            ]}
            children={
                <Switch>
                    <Route path="/server/:server/channel/:channel/settings/permissions">
                        <Permissions channel={channel} />
                    </Route>
                    <Route path="/channel/:channel/settings/permissions">
                        <Permissions channel={channel} />
                    </Route>

                    <Route>
                        <Overview channel={channel} />
                    </Route>
                </Switch>
            }
            category="channel_pages"
            switchPage={switchPage}
            defaultPage="overview"
            showExitButton
        />
    );
});
