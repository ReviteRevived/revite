import { Route, Switch } from "react-router";

import { useEffect, useState } from "preact/hooks";

import { internalSubscribe } from "../../lib/eventEmitter";

import SidebarBase from "./SidebarBase";
import MemberSidebar from "./right/MemberSidebar";
import { PinnedMessages } from "./right/Pins";
import { SearchSidebar } from "./right/Search";

export default function RightSidebar() {
    const [sidebar, setSidebar] = useState<"search" | "pins" | undefined>();
    const close = () => setSidebar(undefined);

    useEffect(
        () =>
            internalSubscribe(
                "RightSidebar",
                "open",
                setSidebar as (...args: unknown[]) => void,
            ),
        [setSidebar],
    );

    let content;
    if (sidebar === "search") {
        content = <SearchSidebar close={close} />;
    } else if (sidebar === "pins") {
        content = <PinnedMessages close={close} />;
    } else {
        content = <MemberSidebar />;
    }

    return (
        <SidebarBase>
            <Switch>
                <Route path="/server/:server/channel/:channel">{content}</Route>
                <Route path="/channel/:channel">{content}</Route>
            </Switch>
        </SidebarBase>
    );
}
