# Git-Bot

Git-Bot is a Next.js application designed to leverage AI capabilities for enhanced GitHub interactions. It integrates with various AI models and GitHub's API to provide intelligent automation and assistance for developers.

## Features

*   **AI-Powered GitHub Interactions:** Utilize advanced AI models for tasks such as code review suggestions, issue summarization, or intelligent pull request descriptions.
*   **Next.js Framework:** Built with Next.js for a performant and scalable web application.
*   **Clerk for Authentication:** Secure user authentication and management powered by Clerk.
*   **Prisma ORM:** Seamless database integration and management with Prisma.
*   **tRPC for API:** Type-safe end-to-end communication with tRPC.
*   **Radix UI & Tailwind CSS:** Modern and accessible UI components styled with Tailwind CSS.
*   **Octokit Integration:** Direct interaction with the GitHub API using Octokit.
*   **Google Gemini & Mistral AI Integration:** Utilizes AI models from Google Gemini and Mistral AI for various intelligent features.

## Technologies Used

*   [Next.js](https://nextjs.org/)
*   [React](https://react.dev/)
*   [TypeScript](https://www.typescriptlang.org/)
*   [Clerk](https://clerk.com/)
*   [Prisma](https://www.prisma.io/)
*   [tRPC](https://trpc.io/)
*   [Tailwind CSS](https://tailwindcss.com/)
*   [Radix UI](https://www.radix-ui.com/)
*   [Octokit](https://octokit.github.io/)
*   [@ai-sdk/google](https://ai.google.dev/): Google AI SDK
*   [@google/generative-ai](https://ai.google.dev/): Google Generative AI
*   [@mistralai/mistralai](https://mistral.ai/): Mistral AI
*   [Zod](https://zod.dev/): Schema validation
*   [Tanstack Query](https://tanstack.com/query/latest): Data fetching and caching

## Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites

*   Node.js (v18 or higher)
*   Bun (or npm/yarn)
*   Git
*   A GitHub account and a Personal Access Token (PAT) with appropriate permissions.
*   API keys for Google Gemini and/or Mistral AI (if utilizing AI features).

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/git-bot.git
    cd git-bot
    ```

2.  **Install dependencies:**

    ```bash
    bun install
    # or npm install
    # or yarn install
    ```

3.  **Set up environment variables:**

    Create a `.env` file in the root directory based on `.env.example`.

    ```
    # .env.example
    # Clerk
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
    CLERK_SECRET_KEY="sk_test_..."

    # GitHub
    GITHUB_CLIENT_ID="your_github_client_id"
    GITHUB_CLIENT_SECRET="your_github_client_secret"

    # Prisma
    DATABASE_URL="postgresql://user:password@host:port/database"

    # Google Gemini
    GOOGLE_API_KEY="your_google_api_key"

    # Mistral AI
    MISTRAL_API_KEY="your_mistral_api_key"
    ```

    Replace the placeholder values with your actual keys and credentials.

4.  **Database Setup:**

    Run Prisma migrations to set up your database schema:

    ```bash
    bun run db:migrate
    # or npm run db:migrate
    ```

    If you want to push the schema without migrations (e.g., for development), use:

    ```bash
    bun run db:push
    # or npm run db:push
    ```

    You can also open Prisma Studio to view your database:

    ```bash
    bun run db:studio
    # or npm run db:studio
    ```

### Running the Development Server

```bash
bun run dev
# or npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Building for Production

```bash
bun run build
# or npm run build
```

Then, to start the production server:

```bash
bun run start
# or npm run start
```

## Available Scripts

In the project directory, you can run:

*   `bun run dev`: Runs the app in development mode.
*   `bun run build`: Builds the application for production.
*   `bun run start`: Starts the production server.
*   `bun run lint`: Lints the code.
*   `bun run lint:fix`: Lints and fixes code issues.
*   `bun run format:check`: Checks code formatting.
*   `bun run format:write`: Formats the code.
*   `bun run db:generate`: Generates Prisma client.
*   `bun run db:migrate`: Applies Prisma migrations.
*   `bun run db:push`: Pushes Prisma schema to the database.
*   `bun run db:studio`: Opens Prisma Studio.
*   `bun run check`: Runs Next.js lint and TypeScript check.
*   `bun run typecheck`: Runs TypeScript check.

## Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'Add some feature'`).
5.  Push to the branch (`git push origin feature/your-feature-name`).
6.  Open a Pull Request.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
