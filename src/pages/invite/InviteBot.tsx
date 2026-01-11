import { useParams } from "react-router-dom";
import { API, User } from "revolt.js";
import styled from "styled-components/macro";
import { useEffect, useState } from "preact/hooks";
import { Button, Category, ComboBox, Preloader, Tip } from "@revoltchat/ui";

import UserIcon from "../../components/common/user/UserIcon";
import UserStatus from "../../components/common/user/UserStatus";
import UserBadges from "../../components/common/user/UserBadges";
import { Username } from "../../components/common/user/UserShort";
import Markdown from "../../components/markdown/Markdown";
import { useClient } from "../../controllers/client/ClientController";
import { modalController } from "../../controllers/modals/ModalController";

const Page = styled.div`
    padding: 6em;
    min-height: 100vh;
    overflow-y: auto;
    overflow-x: hidden;
    box-sizing: border-box;

    @media (max-width: 768px) {
        padding: 2em;
    }
    @media (max-width: 480px) {
        padding: 1em;
    }
`;

const Header = styled.div<{ background?: string }>`
    height: 180px;
    background-color: var(--secondary-header);
    background-image: ${(props) =>
        props.background
            ? `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${props.background})`
            : "none"};
    background-size: cover;
    background-position: center;
    border-radius: var(--border-radius-large) var(--border-radius-large) 0 0;
`;

const ContentWrapper = styled.div`
    background: var(--primary-header);
    padding: 20px;
    border-radius: 0 0 var(--border-radius-large) var(--border-radius-large);
    margin-bottom: 2em;
`;

const BotInfo = styled.div`
    gap: 20px;
    display: flex;
    align-items: flex-start;
    margin-top: -50px; /* Overlap the banner slightly */
    margin-bottom: 20px;

    .details {
        padding-top: 45px;
        h1 {
            margin: 0;
            font-size: 1.8rem;
        }
    }
`;

const BadgeRow = styled.div`
    margin-top: 8px;
    display: flex;
    gap: 4px;
`;

const OwnerEntry = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--secondary-background);
    border-radius: 8px;
    cursor: pointer;
    width: fit-content;
    margin-bottom: 16px;

    &:hover {
        background: var(--secondary-header);
    }
`;

const Option = styled.div`
    gap: 8px;
    display: flex;
    margin-top: 4px;
    margin-bottom: 12px;
`;

export default function InviteBot() {
    const { id } = useParams<{ id: string }>();
    const client = useClient();

    const [data, setData] = useState<API.PublicBot>();
    const [user, setUser] = useState<User>();
    const [profile, setProfile] = useState<API.UserProfile>();
    const [server, setServer] = useState("none");
    const [group, setGroup] = useState("none");

    useEffect(() => {
        if (!id) return;

        client.bots.fetchPublic(id).then(setData).catch(console.error);

        client.users.fetch(id).then((u) => {
            setUser(u);
            u.fetchProfile()
                .then(setProfile)
                .catch(() => {});
        });
    }, [id, client]);

    if (!data || !user) {
        return (
            <Page>
                <Preloader type="spinner" />
            </Page>
        );
    }

    const backgroundURL =
        profile?.background &&
        client.generateFileURL(profile.background as any, { width: 1000 });

    const owner = user.bot?.owner ? client.users.get(user.bot.owner) : null;

    return (
        <Page>
            <Header background={backgroundURL} />

            <ContentWrapper>
                <BotInfo>
                    <UserIcon size={96} target={user} status={true} />
                    <div className="details">
                        <h1>{data.username}</h1>
                        <UserStatus user={user} />

                        {(user.badges || 0) > 0 && (
                            <BadgeRow>
                                <UserBadges
                                    badges={user.badges!}
                                    uid={user._id}
                                />
                            </BadgeRow>
                        )}
                    </div>
                </BotInfo>

                {user.bot && (
                    <>
                        <Category>Bot Owner</Category>
                        <OwnerEntry
                            onClick={() =>
                                modalController.push({
                                    type: "user_profile",
                                    user_id: user.bot!.owner,
                                })
                            }>
                            <UserIcon size={24} target={owner} />
                            <Username user={owner} />
                        </OwnerEntry>
                    </>
                )}

                {data.description && (
                    <>
                        <Category>Description</Category>
                        <div style={{ marginBottom: "1.5em" }}>
                            <Markdown content={data.description} />
                        </div>
                    </>
                )}

                <Category>Add to server</Category>
                <Option>
                    <ComboBox
                        value={server}
                        onChange={(e) => setServer(e.currentTarget.value)}>
                        <option value="none">Select a server</option>
                        {[...client.servers.values()]
                            .filter((x) => x.havePermission("ManageServer"))
                            .map((s) => (
                                <option value={s._id} key={s._id}>
                                    {s.name}
                                </option>
                            ))}
                    </ComboBox>
                    <Button
                        palette="secondary"
                        disabled={server === "none"}
                        onClick={() =>
                            client.bots.invite(data._id, { server })
                        }>
                        Add
                    </Button>
                </Option>

                <Category>Add to group</Category>
                <Option>
                    <ComboBox
                        value={group}
                        onChange={(e) => setGroup(e.currentTarget.value)}>
                        <option value="none">Select a group</option>
                        {[...client.channels.values()]
                            .filter((x) => x.channel_type === "Group")
                            .map((c) => (
                                <option value={c._id} key={c._id}>
                                    {c.name}
                                </option>
                            ))}
                    </ComboBox>
                    <Button
                        palette="secondary"
                        disabled={group === "none"}
                        onClick={() => client.bots.invite(data._id, { group })}>
                        Add
                    </Button>
                </Option>
            </ContentWrapper>
        </Page>
    );
}
