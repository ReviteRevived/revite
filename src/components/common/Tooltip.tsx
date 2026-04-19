import Tippy, { TippyProps } from "@tippyjs/react";
import styled from "styled-components/macro";

import { Text } from "preact-i18n";

type Props = Omit<TippyProps, "children"> & {
    children: Children;
    content: Children;
    icon?: Children;
};

const TooltipContent = styled.div`
    display: flex;
    align-items: center;
    flex-direction: row;
    gap: 6px;

    .tooltip-icon {
        display: flex;
        align-items: center;
        flex-shrink: 0;

        img {
            width: 1.3em;
            height: 1.3em;
            object-fit: contain;
        }
    }

    .tooltip-text {
        color: inherit;
    }
`;

export default function Tooltip(props: Props) {
    const { children, content, icon, ...tippyProps } = props;

    const finalContent = icon ? (
        <TooltipContent>
            <div className="tooltip-icon">{icon}</div>
            <div className="tooltip-text">{content}</div>
        </TooltipContent>
    ) : (
        content
    );

    return (
        <Tippy content={finalContent} animation="shift-away" {...tippyProps}>
            {/*
            // @ts-expect-error Type mis-match. */}
            <div style={`display: flex;`}>{children}</div>
        </Tippy>
    );
}

const PermissionTooltipBase = styled.div`
    display: flex;
    align-items: center;
    flex-direction: column;

    span {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        color: var(--secondary-foreground);
    }

    code {
        font-family: var(--monospace-font);
    }
`;

export function PermissionTooltip(
    props: Omit<Props, "content"> & { permission: string },
) {
    const { permission, ...tooltipProps } = props;

    return (
        <Tooltip
            content={
                <PermissionTooltipBase>
                    <span>
                        <Text id="app.permissions.required" />
                    </span>
                    <code>{permission}</code>
                </PermissionTooltipBase>
            }
            {...tooltipProps}
        />
    );
}
