import { ChevronDown, Filter, Search } from "@styled-icons/boxicons-regular";
import { CalendarAlt, UserPlus } from "@styled-icons/boxicons-solid";
import dayJS from "dayjs";
import { isEqual } from "lodash";
import { observer } from "mobx-react-lite";
import { Virtuoso } from "react-virtuoso";
import { Member, Server } from "revolt.js";
import { decodeTime } from "ulid";

import styles from "./Panes.module.scss";
import classNames from "classnames";
import { Text } from "preact-i18n";
import { useEffect, useMemo, useState } from "preact/hooks";

import {
    Button,
    Category,
    Checkbox,
    IconButton,
    InputBox,
    Preloader,
} from "@revoltchat/ui";

import { normalize } from "../../../components/common/Reuseables";
import UserIcon from "../../../components/common/user/UserIcon";
import { Username } from "../../../components/common/user/UserShort";

interface InnerProps {
    member: Member;
}

const Inner = observer(({ member }: InnerProps) => {
    const [open, setOpen] = useState(false);
    const [roles, setRoles] = useState<string[]>(member.roles ?? []);

    useEffect(() => {
        setRoles(member.roles ?? []);
    }, [member.roles]);

    const user = member.user;
    const orderedRoles = member.server?.orderedRoles ?? [];

    return (
        <div className={styles.memberWrapper}>
            <div
                className={styles.member}
                data-open={open}
                onClick={() => setOpen(!open)}>
                <span>
                    <UserIcon target={user} size={24} />{" "}
                    <Username user={member.user} showServerIdentity="both" />
                </span>
                <IconButton className={styles.chevron}>
                    <ChevronDown size={24} />
                </IconButton>
            </div>
            {open && (
                <div className={styles.memberView}>
                    <div className={styles.memberSince}>
                        <Category>Member Since</Category>
                        <div className={styles.memberGrid}>
                            <div className={styles.memberItem}>
                                <CalendarAlt
                                    size={14}
                                    className={styles.memberIcon}
                                />
                                <div className={styles.memberContent}>
                                    <span className={styles.memberLabel}>
                                        Created
                                    </span>
                                    <span className={styles.memberDate}>
                                        {user
                                            ? dayJS(
                                                  decodeTime(user._id),
                                              ).format("LL")
                                            : "Unknown"}
                                    </span>
                                </div>
                            </div>
                            {member.joined_at && (
                                <div className={styles.memberItem}>
                                    <UserPlus
                                        size={14}
                                        className={styles.memberIcon}
                                    />
                                    <div className={styles.memberContent}>
                                        <span className={styles.memberLabel}>
                                            Joined
                                        </span>
                                        <span className={styles.memberDate}>
                                            {dayJS(member.joined_at).format(
                                                "LL",
                                            )}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ marginTop: "12px" }}>
                        <Category>Edit Member Roles</Category>
                        <div className={styles.rolesEditGrid}>
                            {orderedRoles.map((role) => (
                                <Checkbox
                                    key={role.id}
                                    value={roles.includes(role.id)}
                                    title={
                                        <div className={styles.rolePill}>
                                            <div
                                                className={styles.roleDot}
                                                style={{
                                                    background:
                                                        role.colour ||
                                                        "var(--secondary-foreground)",
                                                }}
                                            />
                                            <span className={styles.roleName}>
                                                {role.name}
                                            </span>
                                        </div>
                                    }
                                    onChange={(v) =>
                                        v
                                            ? setRoles([...roles, role.id])
                                            : setRoles(
                                                  roles.filter(
                                                      (x) => x !== role.id,
                                                  ),
                                              )
                                    }
                                />
                            ))}
                        </div>
                    </div>

                    <Button
                        palette="secondary"
                        style={{ marginTop: "12px", width: "100%" }}
                        disabled={isEqual(member.roles ?? [], roles)}
                        onClick={() => member.edit({ roles })}>
                        <Text id="app.special.modals.actions.save" />
                    </Button>
                </div>
            )}
        </div>
    );
});

export const Members = observer(({ server }: { server: Server }) => {
    const [data, setData] = useState<Member[] | undefined>(undefined);
    const [query, setQuery] = useState("");
    const [roleQuery, setRoleQuery] = useState("");
    const [filterRoles, setFilterRoles] = useState<string[]>([]);
    const [filterOpen, setFilterOpen] = useState(false);

    useEffect(() => {
        function fetch() {
            server
                .fetchMembers()
                .then((data) => data.members)
                .then(setData);
        }

        fetch();

        // Members may be invalidated if we stop receiving events
        // This is not very accurate, this should be tracked within
        // revolt.js so we know the true validity.
        let valid = true,
            invalidationTimer: number;

        function waitToInvalidate() {
            invalidationTimer = setTimeout(() => {
                valid = false;
            }, 15 * 60e3) as never; // 15 minutes
        }

        function cancelInvalidation() {
            if (!valid) {
                fetch();
                valid = true;
            }

            clearTimeout(invalidationTimer);
        }

        addEventListener("blur", waitToInvalidate);
        addEventListener("focus", cancelInvalidation);

        return () => {
            removeEventListener("blur", waitToInvalidate);
            removeEventListener("focus", cancelInvalidation);
        };
    }, [server, setData]);

    const orderedRoles = server.orderedRoles ?? [];

    const visibleRoles = useMemo(() => {
        if (!roleQuery) return orderedRoles;
        const normalizedRoleQuery = normalize(roleQuery);
        return orderedRoles.filter((r) =>
            normalize(r.name).includes(normalizedRoleQuery),
        );
    }, [orderedRoles, roleQuery]);

    const filteredMembers = useMemo(() => {
        if (!data) return [];
        const normalizedQuery = normalize(query);
        return data.filter((m) => {
            const matchesQuery = normalize(m.user?.username ?? "").includes(
                normalizedQuery,
            );
            const matchesRoles =
                filterRoles.length === 0 ||
                filterRoles.every((id) => m.roles?.includes(id));
            return matchesQuery && matchesRoles;
        });
    }, [data, query, filterRoles]);

    return (
        <div className={styles.userList}>
            <InputBox
                placeholder="Search for a specific user..."
                value={query}
                onChange={(e) => setQuery(e.currentTarget.value)}
                palette="secondary"
            />

            <div className={styles.filterSection} style={{ marginTop: "16px" }}>
                <div
                    className={styles.filterHeaderRow}
                    onClick={() => setFilterOpen(!filterOpen)}
                    style={{
                        cursor: "pointer",
                        paddingBottom: filterOpen ? "12px" : "0px",
                    }}>
                    <Category>
                        <Filter size={12} /> Filter by Role
                    </Category>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}>
                        {filterRoles.length > 0 && (
                            <small
                                className={styles.clearFilter}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setFilterRoles([]);
                                }}>
                                Clear
                            </small>
                        )}
                        <IconButton
                            className={classNames(styles.chevron, {
                                [styles.open]: filterOpen,
                            })}>
                            <ChevronDown size={18} />
                        </IconButton>
                    </div>
                </div>
                {filterOpen && (
                    <>
                        <div
                            className={styles.roleSearchWrapper}
                            style={{ marginBottom: "12px" }}>
                            <InputBox
                                placeholder="Search roles..."
                                value={roleQuery}
                                onChange={(e) =>
                                    setRoleQuery(e.currentTarget.value)
                                }
                                palette="secondary"
                            />
                        </div>
                        <div className={styles.filterGrid}>
                            {visibleRoles.map((role) => (
                                <div
                                    key={role.id}
                                    className={classNames(styles.filterRow, {
                                        [styles.active]: filterRoles.includes(
                                            role.id,
                                        ),
                                    })}
                                    onClick={() =>
                                        setFilterRoles((prev) =>
                                            prev.includes(role.id)
                                                ? prev.filter(
                                                      (x) => x !== role.id,
                                                  )
                                                : [...prev, role.id],
                                        )
                                    }>
                                    <div
                                        className={styles.roleDot}
                                        style={{
                                            background:
                                                role.colour ||
                                                "var(--secondary-foreground)",
                                        }}
                                    />
                                    <span className={styles.roleName}>
                                        {role.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <hr className={styles.divider} style={{ margin: "20px 0" }} />

            <div className={styles.subtitle}>
                <span>
                    {filteredMembers.length} / {data?.length ?? 0} Members
                </span>
            </div>

            <div className={styles.virtual}>
                {data ? (
                    <Virtuoso
                        style={{ height: "100%" }}
                        totalCount={filteredMembers.length}
                        itemContent={(index) => (
                            <Inner member={filteredMembers[index]} />
                        )}
                    />
                ) : (
                    <Preloader type="ring" />
                )}
            </div>
        </div>
    );
});
