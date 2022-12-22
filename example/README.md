# Example Express App

## Configuration
The sample application runs over https, so you must provide either an existing SSL certificate or generate a new self-signed one by issuing the following command:

```shell
$ openssl req -nodes -new -x509 -keyout server.key -out server.cert
```

## Running the sample application

To run the sample application, issue the following command:
```shell
$ CLIENT_ID="your_client_id" CLIENT_SECRET="your_client_secret" node example/server.js
```
