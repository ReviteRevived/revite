import { Github } from "@styled-icons/boxicons-logos";
import { BugAlt, Group, ListOl } from "@styled-icons/boxicons-regular";
import { Link } from "react-router-dom";

import styles from "./Panes.module.scss";
import { Text } from "preact-i18n";

import { CategoryButton, Column, Tip } from "@revoltchat/ui";

export function Feedback() {
    return (
        <Column>
            <div className={styles.feedback}>
                <a
                    href="https://github.com/ReviteRevived/revite/issues"
                    target="_blank"
                    rel="noreferrer">
                    <CategoryButton
                        action="external"
                        icon={<ListOl size={24} />}
                        description={
                            <Text id="app.settings.pages.feedback.issue_desc" />
                        }>
                        <Text id="app.settings.pages.feedback.issue" />
                    </CategoryButton>
                </a>
                <a
                    href="https://github.com/orgs/ReviteRevived/projects/2"
                    target="_blank"
                    rel="noreferrer">
                    <CategoryButton
                        action="external"
                        icon={<BugAlt size={24} />}
                        description={
                            <Text id="app.settings.pages.feedback.bug_desc" />
                        }>
                        <Text id="app.settings.pages.feedback.bug" />
                    </CategoryButton>
                </a>
            </div>
        </Column>
    );
}
