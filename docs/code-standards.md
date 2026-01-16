# Code Standards

To maintain a clean and maintainable codebase, all contributions should adhere to these standards.

## 🛠 General Patterns

*   **Functional Components:** Use functional components with Hooks (no class components).
*   **TypeScript:** Every file must be TypeScript. Avoid `any`. Define interfaces in the store or component files.
*   **Naming Conventions:**
    *   **Components:** `PascalCase` (e.g., `MapComponent.tsx`).
    *   **Functions/Variables:** `camelCase`.
    *   **Interfaces:** `PascalCase` (e.g., `interface Radius`).
    *   **Files:** Match the component/utility name.

## 💾 State Management Rules

*   **Store Access:** Use the `useStore` hook to access state.
*   **Selectors:** Prefer selecting specific slices of state to minimize re-renders:
    ```typescript
    const radii = useStore((state) => state.radii);
    ```
*   **Logic Location:** Complex state transitions should happen inside actions in `useStore.ts`, not in components.

## 🎨 Styling Standards

*   **Utility First:** Use Tailwind CSS classes for all styling.
*   **Avoid Custom CSS:** Only use `index.css` or `App.css` for global resets or specific 3rd party overrides.
*   **Dynamic Classes:** Use the `clsx` and `tailwind-merge` pattern for cleaner conditional styles:
    ```typescript
    className={cn("base-class", isActive && "active-class")}
    ```

## 🧪 Testing

*   **Unit Tests:** Use Jest/React Testing Library for utility functions and UI components.
*   **Utility Tests:** Ensure `format.ts` is fully covered for edge cases (e.g., 0 meters, very large distances).
