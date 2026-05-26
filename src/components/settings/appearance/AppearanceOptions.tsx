import { Text } from "preact-i18n";

import { Column, ObservedInputElement } from "@revoltchat/ui";

import { useApplicationState } from "../../../mobx/State";
import { ISettings } from "../../../mobx/stores/Settings";

type BooleanSettingsKey = {
    [K in keyof ISettings]: ISettings[K] extends boolean ? K : never;
}[keyof ISettings];

interface SettingItem {
    key: BooleanSettingsKey;
    default: boolean;
    id?: string;
    label?: string;
    desc?: string;
}

const LAYOUT_SETTINGS: SettingItem[] = [
    {
        key: "appearance:server_categories_vertical",
        default: true,
        label: "Categories Vertical",
        desc: 'Makes the "Categories" tab vertical',
    },
    {
        key: "appearance:mutual_dropdown",
        default: true,
        label: "Mutual Dropdowns",
        desc: "Toggle whether or not mutuals show as a dropdown.",
    },
];

const CHAT_SETTINGS: SettingItem[] = [
    {
        key: "appearance:show_blocked",
        default: true,
        label: "Show Blocked Messages",
        desc: "Toggle whether messages from blocked users are visible.",
    },
    {
        key: "appearance:show_send_button",
        default: false,
        id: "show_send",
    },
    {
        key: "appearance:show_original_status",
        default: false,
        label: "Show Original Status",
        desc: "Show original Revite status indicators",
    },
    {
        key: "appearance:show_account_age",
        default: false,
        id: "show_account_age",
    },
];

const THEME_SETTINGS: SettingItem[] = [
    { key: "appearance:transparency", default: true, id: "transparency" },
    { key: "appearance:seasonal", default: true, id: "seasonal" },
];

export default function AppearanceOptions() {
    const { settings } = useApplicationState();

    const renderSetting = (item: SettingItem) => (
        <ObservedInputElement
            key={item.key}
            type="checkbox"
            value={() => !!settings.get(item.key, item.default)}
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

    const renderThemeSetting = (item: SettingItem) => (
        <ObservedInputElement
            key={item.key}
            type="checkbox"
            value={() => !!settings.get(item.key, item.default)}
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
    );

    return (
        <Column gap="large">
            <section>
                <h3>{"Layout Settings"}</h3>
                <Column gap="normal">
                    {LAYOUT_SETTINGS.map(renderSetting)}
                </Column>
            </section>

            <hr />

            <section>
                <h3>
                    <Text id="app.settings.pages.appearance.appearance_options.title" />
                </h3>
                <Column gap="normal">{CHAT_SETTINGS.map(renderSetting)}</Column>
            </section>

            <hr />

            <section>
                <h3>
                    <Text id="app.settings.pages.appearance.theme_options.title" />
                </h3>
                <Column gap="normal">
                    {THEME_SETTINGS.map(renderThemeSetting)}
                </Column>
            </section>
        </Column>
    );
}
