## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Set environment variables

#### Type 1
```sh
VITE_APP_ORGANIZATION_ID = 'your organization id'
VITE_APP_INSTANCE_ID = 'your instance id'
VITE_APP_API_KEY = "api key"
```
#### Type 2: when you deploy api server on your own server
```sh
VITE_APP_API_KEY = "api key" //optional
VITE_HOST_URL="api-host" //example: "http://localhost:8080/"
```
### Type-Check, Compile and Minify for Production

```sh
npm run build
```
