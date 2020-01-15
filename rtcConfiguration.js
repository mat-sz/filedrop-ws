const stunServer = process.env.STUN_SERVER || 'stun:stun.1.google.com:19302';
const turnServer = process.env.TURN_SERVER || null;
const turnUsername = process.env.TURN_USERNAME || null;
const turnCredential = process.env.TURN_CREDENTIAL || null;

let iceServers = [];

iceServers.push({
    urls: stunServer,
});

if (turnServer && turnUsername && turnCredential) {
    iceServers.push({
        urls: turnServer,
        username: turnUsername,
        credential: turnCredential,
    });
}

module.exports = {
    iceServers,
};