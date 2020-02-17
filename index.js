require('dotenv-flow').config();

// Configuration
const acceptForwardedFor = process.env.WS_BEHIND_PROXY === 'true' || process.env.WS_BEHIND_PROXY === 'yes';
const host = process.env.WS_HOST || '127.0.0.1';
const port = process.env.WS_PORT || 5000;

const WebSocket = require('ws');
const wss = new WebSocket.Server({ host: host, port: port });
const uuid = require('uuid/v4');
const randomColor = require('randomcolor');

const allowedActions = [ 'accept', 'reject', 'cancel' ];
const rtcConfiguration = require('./rtcConfiguration');
let clients = [];

function networkMessage(networkName) {
    const networkClients = clients.filter((client) => client.networkName === networkName);
    const network = networkClients.sort((a, b) => b.firstSeen - a.firstSeen).map((client) => {
        return {
            clientId: client.clientId,
            clientColor: client.clientColor,
        };
    });

    const networkMessage = JSON.stringify({
        type: 'network',
        clients: network,
    });

    networkClients.forEach((client) => {
        try {
            client.send(networkMessage);
        } catch {}
    });
}

function removeClient(client) {
    client.setNetworkName(null);
    clients = clients.filter(c => c !== client);
}

wss.on('connection', (ws, req) => {
    ws.clientId = uuid();
    ws.clientColor = randomColor({ luminosity: 'light' });
    ws.firstSeen = new Date();
    ws.lastSeen = new Date();

    const address = (acceptForwardedFor && req.headers['x-forwarded-for']) ? req.headers['x-forwarded-for'] : req.connection.remoteAddress;
    ws.remoteAddress = address;

    const localClients = clients
                        .filter((client) => client.remoteAddress === address && client.networkName)
                        .sort((a, b) => b.lastSeen - a.lastSeen);
    
    let suggestedName = null;
    if (localClients.length > 0) {
        suggestedName = localClients[0].networkName;
    }

    ws.setNetworkName = (networkName) => {
        const previousName = ws.networkName;
        ws.networkName = networkName;

        if (previousName) {
            networkMessage(previousName);
        }

        if (networkName) {
            networkMessage(networkName);
        }
    };

    clients.push(ws);

    ws.send(JSON.stringify({
        type: 'welcome',
        clientId: ws.clientId,
        clientColor: ws.clientColor,
        suggestedName: suggestedName,
        rtcConfiguration: rtcConfiguration(ws.clientId),
    }));

    ws.on('message', (data) => {
        ws.lastSeen = new Date();

        // Prevents DDoS and abuse.
        if (!data || data.length > 1024) return;

        try {
            const json = JSON.parse(data);
            
            if (json && json.type && typeof json.type === 'string') {
                switch (json.type) {
                    case 'name':
                        if (json.networkName && typeof json.networkName === 'string') {
                            ws.setNetworkName(json.networkName.toUpperCase());
                        }
                        break;
                    case 'transfer':
                        if (json.transferId && typeof json.transferId === 'string'
                            && json.fileName && typeof json.fileName === 'string'
                            && json.fileSize && typeof json.fileSize === 'number'
                            && json.fileType && typeof json.fileType === 'string'
                            && json.targetId && typeof json.targetId === 'string') {
                            
                            json.clientId = ws.clientId;
                            data = JSON.stringify(json);

                            const targets = clients.filter(client => client.clientId === json.targetId && client !== ws);
                            targets.forEach(client => client.send(data));
                        }
                        break;
                    case 'action':
                        if (json.transferId && typeof json.transferId === 'string'
                            && json.action && typeof json.action === 'string'
                            && json.targetId && typeof json.targetId === 'string'
                            && allowedActions.includes(json.action)) {
                            
                            json.clientId = ws.clientId;
                            data = JSON.stringify(json);

                            const targets = clients.filter(client => client.clientId === json.targetId && client !== ws);
                            targets.forEach(client => client.send(data));
                        }
                        break;
                    case 'rtcDescription':
                        if (json.data && typeof json.data === 'object'
                            && json.data.type && typeof json.data.type === 'string'
                            && json.data.sdp && typeof json.data.sdp === 'string'
                            && json.targetId && typeof json.targetId === 'string'
                            && json.transferId && typeof json.transferId === 'string') {

                            json.clientId = ws.clientId;
                            data = JSON.stringify(json);

                            const targets = clients.filter(client => client.clientId === json.targetId && client !== ws);
                            targets.forEach(client => client.send(data));
                        }
                        break;
                    case 'rtcCandidate':
                        if (json.data && typeof json.data === 'object'
                            && json.targetId && typeof json.targetId === 'string'
                            && json.transferId && typeof json.transferId === 'string') {

                            json.clientId = ws.clientId;
                            data = JSON.stringify(json);

                            const targets = clients.filter(client => client.clientId === json.targetId && client !== ws);
                            targets.forEach(client => client.send(data));
                        }
                        break;
                }
            }
        } catch (e) {}
    });

    ws.on('close', () => {
        removeClient(ws);
    });
});

setInterval(() => {
    clients = clients.filter((client) => {
        if (client.readyState <= 1) {
            return true;
        } else {
            client.setNetworkName(null);
            return false;
        }
    });
}, 1000);

// Ping clients to keep the connection alive (when behind nginx)
setInterval(() => {
    const pingMessage = JSON.stringify({ type: 'ping', timestamp: new Date().getTime() });

    clients.forEach((client) => {
        if (client.readyState !== 1) return;

        try {
            client.send(pingMessage);
        } catch {
            removeClient(client);
            client.close();
        }
    });
}, 5000);

// Remove inactive connections
setInterval(() => {
    const minuteAgo = new Date(Date.now() - 1000 * 20);

    clients.forEach((client) => {
        if (client.readyState !== 1) return;
        
        if (client.lastSeen < minuteAgo) {
            removeClient(client);
            client.close();
        }
    });
}, 10000);