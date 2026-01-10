import { Money } from "@styled-icons/boxicons-regular";
import {
    Home as HomeIcon,
    PlusCircle,
    Compass,
    Megaphone,
    Group,
    Cog,
    RightArrowCircle,
} from "@styled-icons/boxicons-solid";
import { observer } from "mobx-react-lite";
import { Link } from "react-router-dom";
import styled from "styled-components/macro";

import styles from "./Home.module.scss";
import "./snow.scss";
import { Text } from "preact-i18n";
import { useMemo } from "preact/hooks";

import { CategoryButton } from "@revoltchat/ui";

import { isTouchscreenDevice } from "../../lib/isTouchscreenDevice";

import { useApplicationState } from "../../mobx/State";

import { PageHeader } from "../../components/ui/Header";
import { useClient } from "../../controllers/client/ClientController";
import { modalController } from "../../controllers/modals/ModalController";

const Overlay = styled.div`
    display: grid;
    height: 100%;

    > * {
        grid-area: 1 / 1;
    }

    .content {
        z-index: 1;
    }
`;

export default observer(() => {
    const client = useClient();
    const state = useApplicationState();

    const seasonalTheme = state.settings.get("appearance:seasonal", true);
    const toggleSeasonalTheme = () =>
        state.settings.set("appearance:seasonal", !seasonalTheme);

    const isDecember = !isTouchscreenDevice && new Date().getMonth() === 11;
    const isOctober = !isTouchscreenDevice && new Date().getMonth() === 9;
    const snowflakes = useMemo(() => {
        const flakes: string[] = [];

        if (isDecember) {
            for (let i = 0; i < 15; i++) {
                flakes.push("❄️");
                flakes.push("❄");
            }

            for (let i = 0; i < 2; i++) {
                flakes.push("🎄");
                flakes.push("☃️");
                flakes.push("⛄");
            }

            return flakes;
        }
        if (isOctober) {
            for (let i = 0; i < 15; i++) {
                flakes.push("🎃");
                flakes.push("💀");
            }

            for (let i = 0; i < 2; i++) {
                flakes.push("👻");
                flakes.push("⚰️");
                flakes.push("🕷️");
            }

            return flakes;
        }

        return flakes;
    }, []);

    return (
        <div className={styles.home}>
            <Overlay>
                {seasonalTheme && (
                    <div className="snowfall">
                        {snowflakes.map((emoji, index) => (
                            <div key={index} className="snowflake">
                                {emoji}
                            </div>
                        ))}
                    </div>
                )}
                <div className="content">
                    <PageHeader icon={<HomeIcon size={24} />} withTransparency>
                        <Text id="app.navigation.tabs.home" />
                    </PageHeader>
                    <div className={styles.homeScreen}>
                        <h3>
                            <Text id="app.special.modals.onboarding.welcome" />
                            <br />
                            Revite Revived
                            <span
                                style={{
                                    display: "block",
                                    opacity: 0.5,
                                    fontSize: "0.4em",
                                    fontWeight: "normal",
                                    marginTop: "4px",
                                }}>
                                by Asraye & the community
                            </span>
                        </h3>
                        <div className={styles.actions}>
                            <a
                                onClick={() =>
                                    modalController.push({
                                        type: "create_group",
                                    })
                                }>
                                <CategoryButton
                                    action="chevron"
                                    icon={<PlusCircle size={32} />}
                                    description={
                                        <Text id="app.home.group_desc" />
                                    }>
                                    <Text id="app.home.group" />
                                </CategoryButton>
                            </a>

                            {client.servers.get(
                                "01KEFCEPJJGWRDE1Z8GZ7XYS7T",
                            ) ? (
                                <Link to="/server/01KEFCEPJJGWRDE1Z8GZ7XYS7T">
                                    <CategoryButton
                                        action="chevron"
                                        icon={<RightArrowCircle size={32} />}
                                        description="Jump back into the Revite Revived community.">
                                        Go to Revite Revived
                                    </CategoryButton>
                                </Link>
                            ) : (
                                <Link to="/invite/Am6TpQ1C">
                                    <CategoryButton
                                        action="chevron"
                                        icon={<Group size={32} />}
                                        description="Join the official Revite Revived community!">
                                        Join Revite Revived
                                    </CategoryButton>
                                </Link>
                            )}

                            <a
                                href="https://asraye-shop.fourthwall.com"
                                target="_blank"
                                rel="noreferrer">
                                <CategoryButton
                                    action="external"
                                    description="Support on-going development and sustaining of the revival project of this beautiful client :3"
                                    icon={<Money size={32} />}>
                                    Support Revite Revived
                                </CategoryButton>
                            </a>
                            <Link to="/settings">
                                <CategoryButton
                                    action="chevron"
                                    description={
                                        <Text id="app.home.settings-tooltip" />
                                    }
                                    icon={<Cog size={32} />}>
                                    <Text id="app.home.settings" />
                                </CategoryButton>
                            </Link>
                            <a
                                href="https://github.com/ReviteRevived/revite"
                                target="_blank"
                                rel="noreferrer">
                                <CategoryButton
                                    action="external"
                                    icon={<Cog size={32} />}
                                    description="View the source code for Revite Revived on GitHub.">
                                    Source Code
                                </CategoryButton>
                            </a>
                        </div>
                        {isDecember && (
                            <a href="#" onClick={toggleSeasonalTheme}>
                                Turn {seasonalTheme ? "off" : "on"} homescreen
                                effects
                            </a>
                        )}
                    </div>
                </div>
            </Overlay>{" "}
        </div>
    );
});
