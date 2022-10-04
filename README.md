# filedrop-ws

WebSockets server for [filedrop-web](https://github.com/mat-sz/filedrop-web).

More details about the project are available in the [filedrop-web](https://github.com/mat-sz/filedrop-web) repository.

## Self-hosting

Please refer to the [Self-hosting](https://github.com/mat-sz/filedrop-web#self-hosting) section in the [filedrop-web](https://github.com/mat-sz/filedrop-web) README.

## Installation

Run `yarn install`, `yarn build` and then simply run `yarn start`. For development you can also run filedrop-ws with live reload, `yarn dev`.

## Configuration

`dotenv-flow` is used to manage the configuration.

The following variables are used for the configuration:

| Variable          | Default value                   | Description                                                                       |
| ----------------- | ------------------------------- | --------------------------------------------------------------------------------- |
| `WS_HOST`         | `127.0.0.1`                     | IP address to bind to.                                                            |
| `WS_PORT`         | `5000`                          | Port to bind to.                                                                  |
| `WS_BEHIND_PROXY` | `no`                            | Set to `yes` if you want the application to respect the `X-Forwarded-For` header. |
| `WS_MAX_SIZE`     | `65536`                         | The limit should accommodate preview images (100x100 thumbnails).                 |
| `STUN_SERVER`     | `stun:stun1.l.google.com:19302` | STUN server address.                                                              |
| `TURN_MODE`       | `default`                       | `default` for static credentials, `hmac` for time-limited credentials.            |
| `TURN_SERVER`     | null                            | TURN server address.                                                              |
| `TURN_USERNAME`   | null                            | TURN username.                                                                    |
| `TURN_CREDENTIAL` | null                            | TURN credential (password).                                                       |
| `TURN_SECRET`     | null                            | TURN secret (required for `hmac`).                                                |
| `TURN_EXPIRY`     | `3600`                          | TURN token expiration time (when in `hmac` mode), in seconds.                     |
| `NOTICE_TEXT`     | null                            | Text of the notice to be displayed for all clients.                               |
| `NOTICE_URL`      | null                            | URL the notice should link to.                                                    |
