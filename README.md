
# Auth0 v4 with Next.js App Router

This project is a monorepo containing multiple applications and packages. For detailed information about the Next.js application with Auth0 integration, please refer to the web application README.

## Repository Structure

This monorepo is organized as follows:

- **apps/**
  - **web/** - Main Next.js application with Auth0 integration

- **packages/**
  - **ui/** - Shared UI components
  - **eslint-config/** - Shared ESLint configuration
  - **typescript-config/** - Shared TypeScript configuration

## Development

To get started with development:

```bash
# Install dependencies
pnpm install

# Run all applications
pnpm dev

# Build all applications
pnpm build
```

## Authentication Flow

This application implements a complete authentication flow with Auth0:

1. **Login**: Users are directed to Auth0 for authentication
2. **Callback**: Auth0 redirects to our callback endpoint
3. **Session Management**: Server-side session with refresh token rotation
4. **Protected Routes**: Middleware-based route protection
5. **Role-based Access**: Different content based on user roles

## Middleware Implementation

Authentication is implemented using middleware chains:

```typescript
// middleware.ts
import { chainMiddleware } from "@weerachai06/auth";
import { authMiddleware } from "./lib/auth0";
import { i18nMiddleware } from "./lib/i18n";

export default chainMiddleware([
  { middleware: i18nMiddleware },
  { middleware: authMiddleware },
]);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

## Security Features

This app is regularly scanned for vulnerabilities with:
- CodeQL for code analysis
- Snyk for dependency scanning
- ESLint security plugins
- TruffleHog for secrets detection

## Resources

- [Auth0 Next.js SDK Documentation](https://auth0.com/docs/quickstart/webapp/nextjs)
- [Next.js Documentation](https://nextjs.org/docs)
- [next-intl Documentation](https://next-intl-docs.vercel.app/)


## Security

This repository has automated security scanning with GitHub Actions. For more information about the security features, refer to the web application README.

## Continuous Integration

This project uses GitHub Actions for:
- Dependency installation and caching
- Security scanning with CodeQL
- Linting and type checking

## License

MIT