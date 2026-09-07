# CareerGraph Hub

Career intelligence platform for institutions. Maps student skills, roadmaps and placement outcomes into an editorial career-intelligence workspace for students, faculty, seniors and administrators.

## Tech Stack

- [React](https://react.dev) 19
- [TypeScript](https://www.typescriptlang.org)
- [TanStack Start](https://tanstack.com/start) + [TanStack Router](https://tanstack.com/router) + [TanStack Query](https://tanstack.com/query)
- [Vite](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com) v4
- [shadcn/ui](https://ui.shadcn.com)

## Getting Started

Requires Node.js and npm.

```sh
npm install
npm run dev
```

The dev server runs at `http://localhost:3000`.

## Scripts

| Script            | Description                  |
| ----------------- | ---------------------------- |
| `npm run dev`     | Start the development server |
| `npm run build`   | Build the app for production |
| `npm run preview` | Preview the production build |
| `npm run lint`    | Run ESLint                   |
| `npm run format`  | Format code with Prettier    |

## Project Structure

```
src/
├── components/    # UI and feature components (shadcn/ui in components/ui)
├── hooks/         # Shared React hooks
├── lib/           # Types, mock data, services, utilities
├── routes/        # TanStack Router file-based routes
├── router.tsx     # Router setup
├── server.ts      # SSR error wrapper / server entry
└── start.ts       # TanStack Start instance & middleware
```

This is a frontend-only application. Data is served from local mock data in `src/lib/mock-data.ts` with typed services in `src/lib/services.ts`.

## License

Private / proprietary.
