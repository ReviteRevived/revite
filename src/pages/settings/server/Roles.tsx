import { HelpCircle, GridAlt } from "@styled-icons/boxicons-solid";
import isEqual from "lodash.isequal";
import { observer } from "mobx-react-lite";
import { DragDropContext } from "react-beautiful-dnd";
import { Server } from "revolt.js";
import styled from "styled-components";

import { Text } from "preact-i18n";
import { useMemo, useState } from "preact/hooks";

import {
    Button,
    PermissionsLayout,
    SpaceBetween,
    H1,
    Checkbox,
    ColourSwatches,
    InputBox,
    Category,
    Row,
} from "@revoltchat/ui";

import { Draggable, Droppable } from "../../../lib/dnd";

import Tooltip from "../../../components/common/Tooltip";
import { PermissionList } from "../../../components/settings/roles/PermissionList";
import { RoleOrDefault } from "../../../components/settings/roles/RoleSelection";
import { useSession } from "../../../controllers/client/ClientController";
import { modalController } from "../../../controllers/modals/ModalController";

interface Props {
    server: Server;
}

const RoleReorderContainer = styled.div`
    margin: 16px 0;
`;

const RoleItem = styled.div`
    display: flex;
    align-items: center;
    padding: 12px 16px;
    margin: 12px 0;
    background: var(--secondary-background);
    border-radius: var(--border-radius);
`;

const RoleInfo = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
`;

const RoleName = styled.div`
    font-weight: 600;
    color: var(--foreground);
`;

const RoleRank = styled.div`
    font-size: 12px;
    color: var(--secondary-foreground);
`;

const DragHandle = styled.div`
    display: flex;
    align-items: center;
    padding-right: 12px;
    color: var(--tertiary-foreground);
    cursor: grab;
`;

/**
 * Hook to memo-ize role information with proper ordering
 * @param server Target server
 * @returns Role array with default at bottom
 */
export function useRolesForReorder(server: Server) {
    return useMemo(() => {
        const roles = [...server.orderedRoles] as RoleOrDefault[];

        roles.push({
            id: "default",
            name: "Default",
            permissions: server.default_permissions,
        });

        return roles;
    }, [server.roles, server.default_permissions]);
}

/**
 * Role reordering component
 */
const RoleReorderPanel = observer(
    ({ server, onExit }: Props & { onExit: () => void }) => {
        const initialRoles = useRolesForReorder(server);
        const [roles, setRoles] = useState(initialRoles);
        const [isReordering, setIsReordering] = useState(false);

        // Update local state when server roles change
        useMemo(() => {
            setRoles(useRolesForReorder(server));
        }, [server.roles, server.default_permissions]);

        const onDragEnd = (result: any) => {
            const { destination, source } = result;
            if (!destination || destination.index === source.index) return;

            if (
                roles[source.index].id === "default" ||
                roles[destination.index].id === "default"
            ) {
                return;
            }

            const newRoles = [...roles];
            const [removed] = newRoles.splice(source.index, 1);
            newRoles.splice(destination.index, 0, removed);
            setRoles(newRoles);
        };

        const saveReorder = async () => {
            setIsReordering(true);
            try {
                const nonDefaultRoles = roles.filter(
                    (role) => role.id !== "default",
                );
                const roleIds = nonDefaultRoles.map((role) => role.id);

                const session = useSession()!;
                const client = session.client!;

                // Make direct API request since it's not in r.js as of writing
                await client.api.patch(`/servers/${server._id}/roles/ranks`, {
                    ranks: roleIds,
                });

                console.log("Roles reordered successfully");
            } catch (error) {
                console.error("Failed to reorder roles:", error);
                setRoles(initialRoles);
            } finally {
                setIsReordering(false);
            }
        };

        const hasChanges = !isEqual(
            roles.filter((r) => r.id !== "default").map((r) => r.id),
            initialRoles.filter((r) => r.id !== "default").map((r) => r.id),
        );

        return (
            <div>
                <SpaceBetween>
                    <H1>
                        <Text id="app.settings.permissions.role_ranking" />
                    </H1>
                    <Row>
                        <Button
                            palette="secondary"
                            onClick={onExit}
                            style={{ marginBottom: "16px" }}>
                            <Text id="app.special.modals.actions.back" />
                        </Button>
                        <Button
                            palette="secondary"
                            disabled={!hasChanges || isReordering}
                            onClick={saveReorder}>
                            <Text id="app.special.modals.actions.save" />
                        </Button>
                    </Row>
                </SpaceBetween>

                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="role-list">
                        {(provided) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}>
                                <RoleReorderContainer>
                                    {roles.map((role, index) => (
                                        <Draggable
                                            key={role.id}
                                            draggableId={role.id}
                                            index={index}
                                            isDragDisabled={
                                                role.id === "default"
                                            }>
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}>
                                                    <RoleItem>
                                                        {role.id !==
                                                            "default" && (
                                                            <DragHandle
                                                                {...provided.dragHandleProps}>
                                                                <GridAlt
                                                                    size={20}
                                                                />
                                                            </DragHandle>
                                                        )}
                                                        <RoleInfo>
                                                            <RoleName>
                                                                {role.name}
                                                            </RoleName>
                                                            <RoleRank>
                                                                {role.id ===
                                                                "default" ? (
                                                                    <Text id="app.settings.permissions.default_desc" />
                                                                ) : (
                                                                    <>
                                                                        <Text id="app.settings.permissions.role_ranking" />{" "}
                                                                        {index}
                                                                    </>
                                                                )}
                                                            </RoleRank>
                                                        </RoleInfo>
                                                    </RoleItem>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </RoleReorderContainer>
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            </div>
        );
    },
);

/**
 * Hook to memo-ize role information.
 * @param server Target server
 * @returns Role array
 */
export function useRoles(server: Server) {
    return useMemo(
        () =>
            [
                // Pull in known server roles.
                ...server.orderedRoles,
                // Include the default server permissions.
                {
                    id: "default",
                    name: "Default",
                    permissions: server.default_permissions,
                },
            ] as RoleOrDefault[],
        [server.roles, server.default_permissions],
    );
}

/**
 * Updated Roles settings menu with reordering panel
 */
export const Roles = observer(({ server }: Props) => {
    const [showReorderPanel, setShowReorderPanel] = useState(false);

    // Consolidate all permissions that we can change right now.
    const currentRoles = useRoles(server);

    const RoleId = styled.div`
        gap: 4px;
        display: flex;
        align-items: center;

        font-size: 12px;
        font-weight: 600;
        color: var(--tertiary-foreground);

        a {
            color: var(--tertiary-foreground);
        }
    `;

    const DeleteRoleButton = styled(Button)`
        margin: 16px 0;
    `;

    const ReorderButton = styled(Button)`
        margin-inline: auto 8px;
    `;

    if (showReorderPanel) {
        return (
            <div>
                <RoleReorderPanel
                    server={server}
                    onExit={() => setShowReorderPanel(false)}
                />
            </div>
        );
    }

    const [allEdits, setAllEdits] = useState<
        Record<string, Partial<RoleOrDefault>>
    >({});
    const [isSaving, setIsSaving] = useState(false);

    async function saveAllChanges() {
        setIsSaving(true);
        try {
            for (const [roleId, roleEdits] of Object.entries(allEdits)) {
                const baseRole = currentRoles.find((x) => x.id === roleId);
                if (!baseRole) continue;

                const mergedRole = { ...baseRole, ...roleEdits };
                const { permissions: permsCurrent, ...currentAttributes } =
                    baseRole;
                const { permissions: permsValue, ...newAttributes } =
                    mergedRole;

                if (!isEqual(permsCurrent, permsValue)) {
                    await server.setPermissions(
                        roleId,
                        typeof permsValue === "number"
                            ? permsValue
                            : { allow: permsValue.a, deny: permsValue.d },
                    );
                }

                if (!isEqual(currentAttributes, newAttributes)) {
                    await server.editRole(roleId, newAttributes);
                }
            }
            setAllEdits({});
        } catch (err) {
            console.error("Failed while performing save updates:", err);
        } finally {
            setIsSaving(false);
        }
    }

    const globalHasChanges = useMemo(() => {
        return Object.keys(allEdits).some((id) => {
            const base = currentRoles.find((r) => r.id === id);
            if (!base) return false;
            return !isEqual(base, { ...base, ...allEdits[id] });
        });
    }, [allEdits, currentRoles]);

    if (showReorderPanel) {
        return (
            <div>
                <RoleReorderPanel
                    server={server}
                    onExit={() => setShowReorderPanel(false)}
                />
            </div>
        );
    }

    return (
        <div>
            <PermissionsLayout
                server={server}
                rank={server.member?.ranking ?? Infinity}
                onCreateRole={(callback) =>
                    modalController.push({
                        type: "create_role",
                        server,
                        callback,
                    })
                }
                editor={({ selected }) => {
                    const currentRole = currentRoles.find(
                        (x) => x.id === selected,
                    )!;
                    if (!currentRole) return null;

                    const activeRoleEdits = allEdits[selected] ?? {};
                    const currentRoleValue = {
                        ...currentRole,
                        ...activeRoleEdits,
                    };

                    const updateActiveRoleFields = (
                        fields: Partial<RoleOrDefault>,
                    ) => {
                        setAllEdits((prev) => ({
                            ...prev,
                            [selected]: {
                                ...prev[selected],
                                ...fields,
                            },
                        }));
                    };

                    function deleteRole() {
                        server.deleteRole(selected);
                        setAllEdits((prev) => {
                            const updated = { ...prev };
                            delete updated[selected];
                            return updated;
                        });
                    }

                    return (
                        <div>
                            <SpaceBetween>
                                <H1>
                                    <Text
                                        id="app.settings.actions.edit"
                                        fields={{ name: currentRole.name }}
                                    />
                                </H1>
                                <ReorderButton
                                    palette="secondary"
                                    onClick={() => setShowReorderPanel(true)}>
                                    <Text id="app.settings.permissions.role_ranking" />
                                </ReorderButton>
                                <Button
                                    palette="secondary"
                                    disabled={!globalHasChanges || isSaving}
                                    onClick={saveAllChanges}>
                                    <Text id="app.special.modals.actions.save" />
                                </Button>
                            </SpaceBetween>
                            <hr />
                            {selected !== "default" && (
                                <>
                                    <section>
                                        <Category>
                                            <Text id="app.settings.permissions.role_name" />
                                        </Category>
                                        <p>
                                            <InputBox
                                                value={currentRoleValue.name}
                                                onChange={(e) =>
                                                    updateActiveRoleFields({
                                                        name: e.currentTarget
                                                            .value,
                                                    })
                                                }
                                                palette="secondary"
                                            />
                                        </p>
                                    </section>
                                    <section>
                                        <Category>{"Role ID"}</Category>
                                        <RoleId>
                                            <Tooltip content="This is a unique identifier for this role.">
                                                <HelpCircle size={16} />
                                            </Tooltip>
                                            <Tooltip
                                                content={
                                                    <Text id="app.special.copy" />
                                                }>
                                                <a
                                                    onClick={() =>
                                                        modalController.writeText(
                                                            currentRole.id,
                                                        )
                                                    }>
                                                    {currentRole.id}
                                                </a>
                                            </Tooltip>
                                        </RoleId>
                                    </section>
                                    <section>
                                        <Category>
                                            <Text id="app.settings.permissions.role_colour" />
                                        </Category>
                                        <p>
                                            <ColourSwatches
                                                value={
                                                    currentRoleValue.colour ??
                                                    "gray"
                                                }
                                                onChange={(colour) =>
                                                    updateActiveRoleFields({
                                                        colour,
                                                    })
                                                }
                                            />
                                        </p>
                                    </section>
                                    <section>
                                        <Category>
                                            <Text id="app.settings.permissions.role_options" />
                                        </Category>
                                        <p>
                                            <Checkbox
                                                value={
                                                    currentRoleValue.hoist ??
                                                    false
                                                }
                                                onChange={(hoist) =>
                                                    updateActiveRoleFields({
                                                        hoist,
                                                    })
                                                }
                                                title={
                                                    <Text id="app.settings.permissions.hoist_role" />
                                                }
                                                description={
                                                    <Text id="app.settings.permissions.hoist_desc" />
                                                }
                                            />
                                        </p>
                                    </section>
                                </>
                            )}
                            <h1>
                                <Text id="app.settings.permissions.edit_title" />
                            </h1>
                            <PermissionList
                                value={currentRoleValue.permissions}
                                onChange={(permissions) =>
                                    updateActiveRoleFields({ permissions })
                                }
                                target={server}
                            />
                            {selected !== "default" && (
                                <>
                                    <hr />
                                    <h1>
                                        <Text id="app.settings.categories.danger_zone" />
                                    </h1>
                                    <DeleteRoleButton
                                        palette="error"
                                        compact
                                        onClick={deleteRole}>
                                        <Text id="app.settings.permissions.delete_role" />
                                    </DeleteRoleButton>
                                </>
                            )}
                        </div>
                    );
                }}
            />
        </div>
    );
});
