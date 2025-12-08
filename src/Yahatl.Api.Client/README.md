# Yahatl API Client

This project contains the generated TypeScript client for the Yahatl API.

## Client Generation

The client is generated using NSwag. The configuration is located in `nswag.json`.

### Prerequisites

- The API must be running locally on `http://localhost:5294`.
- Node.js and npm must be installed.

### Steps to Generate

1. Start the API:
   ```bash
   dotnet run --project ../Yahatl.Api/Yahatl.Api.csproj --launch-profile http
   ```

2. Generate the client:
   ```bash
   npm install
   npm run generate
   ```

   This will verify the local API is reachable and generate the `generated/Client.ts` file.

### MSBuild Integration

Currently, the client generation is manual to avoid build-time dependencies on a running server.
To enable build-time generation:
1. Ensure the API is running or use `aspnetcore2openapi` (which requires loading the assembly).
2. Uncomment the `NSwag` target in `Yahatl.Api.csproj` (if added) or add a target to run `npm run generate`.
