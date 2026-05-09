import { useParams } from "react-router-dom";
import { API, User } from "revolt.js";
import styled from "styled-components/macro";

import { useEffect, useState } from "preact/hooks";

import { Button, Category, ComboBox, Preloader, Tip } from "@revoltchat/ui";

import UserBadges from "../../components/common/user/UserBadges";
import UserIcon from "../../components/common/user/UserIcon";
import { Username } from "../../components/common/user/UserShort";
import UserStatus from "../../components/common/user/UserStatus";
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

const ContentWrapper = styled.div<{ hasHeader: boolean }>`
    background: var(--primary-header);
    padding: 20px;
    border-radius: ${(props) =>
        props.hasHeader
            ? "0 0 var(--border-radius-large) var(--border-radius-large)"
            : "var(--border-radius-large)"};
    margin-bottom: 2em;
`;

const BotInfo = styled.div<{ hasHeader: boolean }>`
    gap: 20px;
    display: flex;
    align-items: flex-start;
    margin-top: ${(props) =>
        props.hasHeader
            ? "-50px"
            : "0"}; /* Change depending on whether or not the banner exists */
    margin-bottom: 20px;

    .details {
        padding-top: ${(props) => (props.hasHeader ? "45px" : "0")};
        h1 {
            margin: 0;
            font-size: 1.8rem;
        }
    }
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

const AvatarImg = styled.img<{ hasHeader: boolean }>`
    width: 96px;
    height: 96px;
    border-radius: 50%;
    background-color: var(--secondary-background);
    object-fit: cover;
    border: 6px solid var(--primary-header);
    box-sizing: content-box;
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

    const [data, setData] =
        useState<{ _id: string; username: string; description?: string }>();
    const [user, setUser] = useState<User>();
    const [profile, setProfile] = useState<API.UserProfile>();
    const [server, setServer] = useState("none");
    const [group, setGroup] = useState("none");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        setLoading(true);

        client.api
            .get(`/bots/${id as any}/invite`)
            .then((inviteData) => {
                setData(inviteData as any);
                return client.users.fetch(id).catch(() => null);
            })
            .then((u) => {
                if (u) {
                    setUser(u);
                    return u.fetchProfile().catch(() => null);
                }
            })
            .then((p) => {
                if (p) setProfile(p as API.UserProfile);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id, client]);

    if (loading || !data) {
        return (
            <Page>
                <Preloader type="spinner" />
            </Page>
        );
    }

    const avatarURL =
        user?.avatarURL ||
        (data?.avatar // Avatar likes to bitch, but it works. So.. Don't fix it
            ? `https://cdn.stoatusercontent.com/avatars/${data.avatar}/original`
            : null);

    const backgroundURL = profile?.background
        ? client.generateFileURL(profile.background as any, { width: 1000 })
        : undefined;

    const hasHeader = !!backgroundURL;

    const ownerId = user?.bot?.owner || (data as any)?.owner;
    const owner = ownerId ? client.users.get(ownerId) : null;

    return (
        <Page>
            {hasHeader && <Header background={backgroundURL} />}
            <ContentWrapper hasHeader={hasHeader}>
                <BotInfo hasHeader={hasHeader}>
                    <AvatarImg
                        src={avatarURL}
                        alt={data.username}
                        hasHeader={hasHeader}
                    />
                    <div className="details">
                        <h1>{data.username}</h1>
                        {user && <UserStatus user={user} />}
                        {user?.badges && (
                            <div
                                style={{
                                    marginTop: "8px",
                                    display: "flex",
                                    gap: "4px",
                                }}>
                                <UserBadges
                                    badges={user.badges}
                                    uid={user._id}
                                />
                            </div>
                        )}
                    </div>
                </BotInfo>

                {ownerId && (
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

                <div style={{ marginTop: "2em" }}>
                    <Tip palette="warning">
                        Public bots are not proactively moderated. Please
                        exercise caution when adding bots to your server.
                    </Tip>
                    <div style={{ height: "8px" }} />
                    <Tip palette="primary">
                        This bot will be added without any initial permissions.
                        You will need to manually assign a role or update
                        channel overrides for the bot to function.
                    </Tip>
                </div>
            </ContentWrapper>
        </Page>
    );
}
