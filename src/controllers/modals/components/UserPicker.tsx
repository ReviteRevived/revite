/* eslint-disable react/jsx-no-literals */
import styled from "styled-components";

import { Text } from "preact-i18n";
import { useMemo, useState } from "preact/hooks";

import { Modal, InputBox } from "@revoltchat/ui";

import { normalize } from "../../../components/common/Reuseables";
import UserCheckbox from "../../../components/common/user/UserCheckbox";
import { useClient } from "../../client/ClientController";
import { ModalProps } from "../types";

const List = styled.div`
    max-width: 100%;
    max-height: 360px;
    overflow-y: auto;
`;

const SearchWrapper = styled.div`
    padding-bottom: 8px;
`;

export default function UserPicker({
    callback,
    omit,
    ...props
}: ModalProps<"user_picker">) {
    const [selected, setSelected] = useState<string[]>([]);
    const [search, setSearch] = useState("");

    const omitted = useMemo(
        () => new Set([...(omit || []), "00000000000000000000000000"]),
        [omit],
    );

    const client = useClient();

    const filtered = useMemo(() => {
        const q = normalize(search.trim());

        return [...client.users.values()].filter(
            (x) =>
                x &&
                x.relationship === "Friend" &&
                !omitted.has(x._id) &&
                (q === "" ||
                    normalize(x.username).includes(q) ||
                    (x.display_name && normalize(x.display_name).includes(q))),
        );
    }, [client.users, search, omitted]);

    return (
        <Modal
            {...props}
            title={<Text id="app.special.popovers.user_picker.select" />}
            actions={[
                {
                    children: (
                        <Text id="app.special.modals.actions.ok" />
                    ) as any,
                    onClick: () => callback(selected).then(() => true),
                },
            ]}>
            <SearchWrapper>
                <InputBox
                    placeholder="Search friends..."
                    value={search}
                    onInput={(e) => setSearch(e.currentTarget.value)}
                    autoFocus
                />
            </SearchWrapper>
            <List>
                {filtered.map((x) => (
                    <UserCheckbox
                        key={x._id}
                        user={x}
                        value={selected.includes(x._id)}
                        onChange={(v) => {
                            if (v) {
                                setSelected([...selected, x._id]);
                            } else {
                                setSelected(
                                    selected.filter((y) => y !== x._id),
                                );
                            }
                        }}
                    />
                ))}
            </List>
        </Modal>
    );
}
