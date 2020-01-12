const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 5000 });
const uuid = require('uuid/v4');
const randomColor = require('randomcolor');

const allowedActions = [ 'accept', 'reject', 'cancel' ];
let clients = [];
wss.on('connection', (ws, req) => {
    ws.clientId = uuid();
    ws.clientColor = randomColor({ luminosity: 'light' });
    ws.lastSeen = new Date();

    const address = (process.env.WS_BEHIND_PROXY && req.headers['x-forwarded-for']) ? req.headers['x-forwarded-for'] : req.connection.remoteAddress;
    ws.remoteAddress = address;

    const networkClients = clients
                        .filter((client) => client.remoteAddress === address && client.clientName)
                        .sort((a, b) => b.lastSeen - a.lastSeen);
    
    let suggestedName = null;
    if (networkClients.length > 0) {
        suggestedName = networkClients[0].clientName;
    }

    clients.push(ws);

    ws.send(JSON.stringify({
        type: 'welcome',
        clientId: ws.clientId,
        clientColor: ws.clientColor,
        suggestedName: suggestedName,
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
                        if (json.clientName && typeof json.clientName === 'string') {
                            ws.clientName = json.clientName.toUpperCase();
                        }
                        break;
                    case 'transfer':
                        if (json.transferId && typeof json.transferId === 'string'
                            && json.fileName && typeof json.fileName === 'string'
                            && json.fileSize && typeof json.fileSize === 'number'
                            && json.fileType && typeof json.fileType === 'string') {
                            
                            json.clientId = ws.clientId;
                            data = JSON.stringify(json);

                            const targets = clients.filter(client => client.clientName === ws.clientName && client !== ws);
                            targets.forEach(client => client.send(data));
                        }
                        break;
                    case 'action':
                        if (json.transferId && typeof json.transferId === 'string'
                            && json.action && typeof json.action === 'string'
                            && allowedActions.includes(json.action)) {
                            
                            json.clientId = ws.clientId;
                            data = JSON.stringify(json);

                            const targets = clients.filter(client => client.clientName === ws.clientName && client !== ws);
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
});

setInterval(() => {
    clients = clients.filter((client) => client.readyState <= 1);
}, 1000);
