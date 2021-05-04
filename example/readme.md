# Example

This example is intended to implement backstage with a GUI (SPA), keycloak and kong with pepkong using a partial mock of some dojot APIs.

__ATTENTION__ It's highly recommended to communicate over HTTPS.

To run this example, type:

```sh
docker-compose up
```

## Using the example

Access [http://localhost:8000/](http://localhost:8000/) in your browser.

__NOTE__ There are 2 registered users, the `admin` with `admin` password and the `user` with `user` password. The `admin` user can perform any action, the  `user` only involving GET.
