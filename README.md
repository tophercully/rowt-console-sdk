# Rowt Console SDK

A TypeScript SDK for interacting with the [Rowt Server API](https://npmjs.com/create-rowt-server).

[Additional Documentation](https://docs.rowt.app)

## Installation

```bash
npm install rowt-console-sdk
```

## Usage

```typescript
import RowtConsole from "rowt-console-sdk";
// Or alternatively, import specific types
import { RowtConsole, RowtProject, RowtUser } from "rowt-console-sdk";

// Initialize the SDK with your base URL
const rowtConsole = new RowtConsole("https://api.rowt.io");

// Login and get a user instance
async function login() {
  try {
    const user = await rowtConsole.login({
      email: "user@example.com",
      password: "password",
    });
    console.log("Logged in as:", user.email);

    // Get user projects
    const projects = await rowtConsole.getUserProjects();
    console.log("User projects:", projects);
  } catch (error) {
    console.error("Login failed:", error);
  }
}

login();
```

## Available Methods

The SDK provides the following methods:

- `login(credentials)` - Authenticate with the Rowt Console API
- `logout()` - Log out and clear tokens
- `validateUser(credentials)` - Validate user credentials
- `createUser(email, password)` - Create a new user
- `getProfile()` - Get the current user's profile
- `getCurrentUser()` - Get the current user
- `updatePassword(updatePasswordDTO)` - Update a user's password
- `getLinksByProjectId(projectId, includeInteractions)` - Get links for a project
- `getProjectById(projectId, options)` - Get a project by ID
- `getUserProjects()` - Get all projects for the current user
- `updateProject(project)` - Update a project
- `createProject(project)` - Create a new project
- `regenerateApiKey(projectId)` - Regenerate an API key for a project
- `getUserUsage(userId)` - Get usage statistics for a user
- `getUserTier(userId)` - Get tier information for a user

## License

MIT
