# Supabase Google Login Test App

This is a simple test application demonstrating how to implement Google OAuth login using React, Vite, and Supabase.

## Features

- User login via Google
- Displaying user session information
- User logout

## Built With

- React
- Vite
- Supabase

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js and npm installed.
- A Supabase account and project.

### Installation & Setup

1.  Clone the repo:
    ```sh
    git clone https://github.com/shoepack/test-login-app.git
    ```
2.  Navigate to the project directory:
    ```sh
    cd test-login-app/supa-google
    ```
3.  Install NPM packages:
    ```sh
    npm install
    ```
4.  Create a `.env.local` file in the `supa-google` directory and add your Supabase project URL and anon key:
    ```
    VITE_SUPABASE_URL=YOUR_SUPABASE_URL
    VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    ```
5.  Run the development server:
    ```sh
    npm run dev
    ```
