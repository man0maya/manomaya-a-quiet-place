# Manomaya - A Quiet Place

A peaceful, spiritual sanctuary built with React, Vite, and Supabase.

## Features

* **Spiritual Quotes & Reflections**: Daily quotes and insights drawn from various spiritual traditions.
* **Interactive Elements**: A calm UI for reading, reflecting, and engaging with content.
* **Admin Dashboard**: Manage quotes, stories, and site configuration.
* **Supabase Backend**: Powered by Supabase for database, authentication, and edge functions.

## Technologies Used

* [Vite](https://vitejs.dev/) - Frontend tooling
* [React](https://reactjs.org/) - UI library
* [TypeScript](https://www.typescriptlang.org/) - Type safety
* [Tailwind CSS](https://tailwindcss.com/) - Styling
* [shadcn/ui](https://ui.shadcn.com/) - UI components
* [Supabase](https://supabase.com/) - Backend (Database, Auth, Edge Functions)

## Getting Started

### Prerequisites

* Node.js & npm installed
* A Supabase project

### Installation & Setup

1. **Clone the repository**
   ```sh
   git clone https://github.com/man0maya/manomaya-a-quiet-place.git
   cd manomaya-a-quiet-place
   ```

2. **Install dependencies**
   ```sh
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root of your project and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   ```

4. **Start the development server**
   ```sh
   npm run dev
   ```

## Building for Production

To create a production build, run:
```sh
npm run build
```
This will generate optimized static files in the `dist` directory.
