# filedrop-ws

WebSockets server for [filedrop-web](https://github.com/mat-sz/filedrop-web).

More details about the project are available in the [filedrop-web](https://github.com/mat-sz/filedrop-web) repository.

## Installation

Run `yarn install`, then simply run `yarn start`.

## Configuration

`dotenv-flow` is used to manage the configuration.

The following variables are used for the configuration:

| Variable          | Default value | Description                                                                       |
|-------------------|---------------|-----------------------------------------------------------------------------------|
| `WS_HOST`         | `127.0.0.1`   | IP address to bind to.                                                            |
| `WS_PORT`         | `5000`        | Port to bind to.                                                                  |
| `WS_BEHIND_PROXY` | `no`          | Set to `yes` if you want the application to respect the `X-Forwarded-For` header. |
| `STUN_SERVER`     | `stun:stun.1.google.com:19302` | WebRTC configuration - STUN server.                              |
| `TURN_SERVER`     | null                           | WebRTC configuration - TURN server.                              |
| `TURN_USERNAME`   | null                           | WebRTC configuration - TURN username.                            |
| `TURN_CREDENTIAL` | null                           | WebRTC configuration - TURN credential (password).               |