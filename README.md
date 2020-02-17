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
| `STUN_SERVER`     | `stun:stun.1.google.com:19302` | STUN server address.                      |
| `TURN_MODE`       | `default`                      | `default` for static credentials, `hmac` for time-limited credentials. |
| `TURN_SERVER`     | null                           | TURN server address.                      |
| `TURN_USERNAME`   | null                           | TURN username.                            |
| `TURN_CREDENTIAL` | null                           | TURN credential (password).               |
| `TURN_SECRET`     | null                           | TURN secret (required for `hmac`).        |
| `TURN_EXPIRY`     | `3600`                         | TURN token expiration time (when in `hmac` mode), in seconds. |