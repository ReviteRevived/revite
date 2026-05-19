import isEqual from "lodash.isequal";
import { observer } from "mobx-react-lite";
import { Channel, API, DEFAULT_PERMISSION_DIRECT_MESSAGE } from "revolt.js";

import { Text } from "preact-i18n";
import { useMemo, useState } from "preact/hooks";

import { PermissionsLayout, Button, SpaceBetween, H1 } from "@revoltchat/ui";

import { TextReact } from "../../../lib/i18n";

import { PermissionList } from "../../../components/settings/roles/PermissionList";
import { RoleOrDefault } from "../../../components/settings/roles/RoleSelection";
import { useRoles } from "../server/Roles";

interface Props {
    channel: Channel;
}

export default observer(({ channel }: Props) => {
    type PermValue = API.OverrideField | number;
    const [allEdits, setAllEdits] = useState<Record<string, PermValue>>({});
    const [isSaving, setIsSaving] = useState(false);

    // Consolidate all permissions that we can change right now.
    const currentRoles = useMemo(() => {
        return channel.channel_type === "Group"
            ? ([
                  {
                      id: "default",
                      name: "Default",
                      permissions:
                          channel.permissions ??
                          DEFAULT_PERMISSION_DIRECT_MESSAGE,
                  },
              ] as RoleOrDefault[])
            : (useRoles(channel.server! as any).map((role) => {
                  return {
                      ...role,
                      permissions: (role.id === "default"
                          ? channel.default_permissions
                          : channel.role_permissions?.[role.id]) ?? {
                          a: 0,
                          d: 0,
                      },
                  };
              }) as RoleOrDefault[]);
    }, [
        channel.permissions,
        channel.default_permissions,
        channel.role_permissions,
        channel.server,
    ]);

    // Upload new role information to server.
    async function saveAllChanges() {
        setIsSaving(true);
        try {
            for (const [roleId, updatedPerms] of Object.entries(allEdits)) {
                await channel.setPermissions(
                    roleId,
                    typeof updatedPerms === "number"
                        ? updatedPerms
                        : {
                              allow: updatedPerms.a,
                              deny: updatedPerms.d,
                          },
                );
            }
            setAllEdits({});
        } catch (err) {
            console.error(
                "Failed executing batch channel overrides update: ",
                err,
            );
        } finally {
            setIsSaving(false);
        }
    }

    const globalHasChanges = useMemo(() => {
        return Object.keys(allEdits).some((id) => {
            const currentRole = currentRoles.find((x) => x.id === id);
            if (!currentRole) return false;
            return !isEqual(currentRole.permissions, allEdits[id]);
        });
    }, [allEdits, currentRoles]);

    return (
        <PermissionsLayout
            channel={channel}
            rank={channel.server?.member?.ranking ?? Infinity}
            editor={({ selected }) => {
                const currentRole = currentRoles.find(
                    (x) => x.id === selected,
                )!;

                if (!currentRole) return null;

                const currentPermission = currentRole.permissions;
                const currentValue = allEdits[selected] ?? currentPermission;

                return (
                    <div>
                        <SpaceBetween>
                            <H1>
                                <TextReact
                                    id="app.settings.permissions.title"
                                    fields={{ role: currentRole.name }}
                                />
                            </H1>
                            <Button
                                palette="secondary"
                                disabled={!globalHasChanges || isSaving}
                                onClick={saveAllChanges}>
                                <Text id="app.special.modals.actions.save" />
                            </Button>
                        </SpaceBetween>
                        <PermissionList
                            value={currentValue}
                            onChange={(val) => {
                                setAllEdits((prev) => ({
                                    ...prev,
                                    [selected]: val,
                                }));
                            }}
                            filter={[
                                ...(channel.channel_type === "Group"
                                    ? []
                                    : ["ViewChannel" as const]),
                                "ReadMessageHistory",
                                "SendMessage",
                                "ManageMessages",
                                "InviteOthers",
                                "SendEmbeds",
                                "UploadFiles",
                                "Masquerade",
                                "React",
                                "ManageChannel",
                                "ManagePermissions",
                            ]}
                            target={channel}
                        />
                    </div>
                );
            }}
        />
    );
});
