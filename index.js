const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 5000 });
const uuid = require('uuid/v4');

let clients = [];
wss.on('connection', function connection(ws) {
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
                            ws.clientName = json.clientName;
                        }
                        break;
                    case 'request':
                        if (json.requestId && typeof json.requestId === 'string'
                            && json.fileName && typeof json.fileName === 'string') {
                            
                            data.clientId = ws.clientId;
                            const targets = clients.find(client => client.clientName === ws.clientName);
                            targets.forEach(client => client.send(data));
                        }
                        break;
                    case 'rtc':
                        if (json.data && typeof json.data === 'object'
                            && json.data.type && typeof json.data.type === 'string'
                            && json.data.sdp && typeof json.data.sdp === 'string'
                            && json.targetId && typeof json.targetId === 'string'
                            && json.requestId && typeof json.requestId === 'string') {

                            data.clientId = ws.clientId;
                            const targets = clients.find(client => client.clientId === json.targetId);
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
