import { Text } from "preact-i18n";

import { Column, ObservedInputElement } from "@revoltchat/ui";

import { useApplicationState } from "../../../mobx/State";

const APPEARANCE_SETTINGS = [
    {
        key: "appearance:show_blocked",
        default: true,
        label: "Show Blocked Messages",
        desc: "Toggle whether messages from blocked users are visible.",
    },
    {
        key: "appearance:show_account_age",
        default: false,
        id: "show_account_age",
    },
    {
        key: "appearance:show_send_button",
        default: false,
        id: "show_send",
    },
    {
        key: "appearance:mutual_dropdown",
        default: true,
        label: "Mutual Dropdowns",
        desc: "Toggle whether or not mutuals show as a dropdown.",
    },
];

const THEME_SETTINGS = [
    { key: "appearance:transparency", default: true, id: "transparency" },
    { key: "appearance:seasonal", default: true, id: "seasonal" },
];

export default function AppearanceOptions() {
    const { settings } = useApplicationState();

    const renderSetting = (item: any) => (
        <ObservedInputElement
            key={item.key}
            type="checkbox"
            value={() => settings.get(item.key) ?? item.default}
            onChange={(v) => settings.set(item.key, v)}
            title={
                item.id ? (
                    <Text
                        id={`app.settings.pages.appearance.appearance_options.${item.id}`}
                    />
                ) : (
                    item.label
                )
            }
            description={
                item.id ? (
                    <Text
                        id={`app.settings.pages.appearance.appearance_options.${item.id}_desc`}
                    />
                ) : (
                    item.desc
                )
            }
        />
    );

    return (
        <Column gap="large">
            <section>
                <h3>
                    <Text id="app.settings.pages.appearance.appearance_options.title" />
                </h3>
                {APPEARANCE_SETTINGS.map(renderSetting)}
            </section>

            <hr />

            <section>
                <h3>
                    <Text id="app.settings.pages.appearance.theme_options.title" />
                </h3>
                <Column>
                    {THEME_SETTINGS.map((item) => (
                        <ObservedInputElement
                            key={item.key}
                            type="checkbox"
                            value={() => settings.get(item.key) ?? item.default}
                            onChange={(v) => settings.set(item.key, v)}
                            title={
                                <Text
                                    id={`app.settings.pages.appearance.theme_options.${item.id}`}
                                />
                            }
                            description={
                                <Text
                                    id={`app.settings.pages.appearance.theme_options.${item.id}_desc`}
                                />
                            }
                        />
                    ))}
                </Column>
            </section>
        </Column>
    );
}
