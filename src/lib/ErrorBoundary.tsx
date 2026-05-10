import axios from "axios";
import localforage from "localforage";
import * as stackTrace from "stacktrace-js";
import styled from "styled-components/macro";

import { useEffect, useErrorBoundary, useState } from "preact/hooks";

import { Button } from "@revoltchat/ui";

import { GIT_REVISION } from "../revision";

const CrashContainer = styled.div`
    // defined for the Button component
    --error: #ed4245;
    --primary-background: #2d2d2d;
    height: 100%;
    padding: 12px;
    background: #191919;
    color: white;
    h3 {
        margin: 0;
        margin-bottom: 12px;
    }
    code {
        font-size: 1.1em;
    }
    .buttonDivider {
        margin: 8px;
    }
`;

interface Props {
    children: any;
    section: "client" | "renderer";
}

const ERROR_URL = "https://api.asraye.com/api/notify";
const REPORT_API_KEY = import.meta.env.VITE_REPORT_API_KEY;
export function reportError(error: Error, section: string) {
    stackTrace.fromError(error).then((stackframes) =>
        axios
            .post(
                ERROR_URL,
                {
                    message: `🚨 **New Crash Reported**\n\n**Section:** ${section}\n**Revision:** \`${GIT_REVISION}\`\n**Error:** \`${
                        error.message
                    }\` \n\n**Stack Trace:**\n\`\`\`\n${error.stack?.slice(
                        0,
                        1500,
                    )}\n\`\`\``,
                },
                {
                    headers: {
                        "x-api-key": REPORT_API_KEY,
                        "Content-Type": "application/json",
                    },
                },
            )
            .catch((err) => console.error("Could not send report:", err)),
    );
}

export default function ErrorBoundary({ children, section }: Props) {
    const [error, ignoreError] = useErrorBoundary();
    const [confirm, setConfirm] = useState(false);

    async function reset() {
        if (confirm) {
            await localforage.clear();
            location.reload();
        } else {
            setConfirm(true);
        }
    }

    useEffect(() => {
        if (error) {
            reportError(error, section);
        }
    }, [error, section]);

    if (error) {
        return (
            <CrashContainer>
                <h3>
                    {section === "client"
                        ? "Client Crash Report"
                        : "Component Error"}
                </h3>

                <Button onClick={ignoreError}>
                    {" "}
                    Ignore error and try again
                </Button>
                <div class="buttonDivider" />

                <Button onClick={() => location.reload()}>Refresh page</Button>
                <div class="buttonDivider" />

                <Button palette="error" onClick={reset}>
                    {confirm ? "Are you sure?" : "Reset all app data"}
                </Button>

                <br />
                <br />
                <div>Revite Revived has encountered an error:</div>
                <pre>
                    <code>{error?.message}</code>
                </pre>
                <div style={{ opacity: 0.6, fontSize: "0.8em" }}>
                    This error has been automatically reported!
                </div>
            </CrashContainer>
        );
    }

    return <>{children}</>;
}
