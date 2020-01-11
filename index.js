const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 5000 });
const uuid = require('uuid/v4');

const allowedActions = [ 'accept', 'reject', 'cancel' ];
let clients = [];
wss.on('connection', (ws) => {
    ws.clientId = uuid();
    clients.push(ws);

    ws.send(JSON.stringify({
        type: 'welcome',
        clientId: ws.clientId,
    }));

    ws.on('message', (data) => {
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
