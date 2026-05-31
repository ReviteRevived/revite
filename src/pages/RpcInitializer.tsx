import { useEffect } from "preact/hooks";

import { useApplicationState } from "../mobx/State";

import { rpcService } from "../controllers/RpcService";
import { useClient } from "../controllers/client/ClientController";

export function RpcInitializer() {
    const { settings } = useApplicationState();
    const client = useClient();

    useEffect(() => {
        if (settings && client) {
            rpcService.init(settings, client);
        }
    }, [settings, client]);

    return null;
}
