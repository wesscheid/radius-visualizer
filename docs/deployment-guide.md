# Deployment Guide

This guide covers how to prepare the Radius Visualizer for development and production environments.

## 💻 Local Development

1.  **Environment Variables:**
    Create a `.env` file in the root directory:
    ```text
    REACT_APP_GOOGLE_MAPS_API_KEY=your_api_key_here
    ```

2.  **Dependencies:**
    ```bash
    npm install
    ```

3.  **Start Dev Server:**
    ```bash
    npm start
    ```
    The app will be available at `http://localhost:3000`.

## 🏗 Production Build

To create a production-optimized build:

1.  **Generate Build:**
    ```bash
    npm run build
    ```
    The output will be in the `build/` directory.

2.  **Hosting:**
    The project is configured for **Firebase Hosting**.
    *   Login: `firebase login`
    *   Initialize: `firebase init` (Select Hosting)
    *   Deploy: `firebase deploy`

## 🧪 Quality Checks

Before deploying, run the following:

*   **Linting:** `npm run lint` (if configured)
*   **Testing:** `npm test -- --watchAll=false`
*   **Type Checking:** `npx tsc --noEmit`
