# Contributing to Matrix Smart Makkah

Thank you for your interest in contributing to **Matrix Smart Makkah** — a Smart City Operating System by **Abdulaziz AlAmawi**.

## Getting Started

1. Fork the repository and clone your fork.
2. Install dependencies:
   ```bash
   cd apps/web && npm install
   cd ../../services/ml && pip install -r requirements.txt
   ```
3. Run the development stack:
   ```bash
   # Terminal 1 — Web
   cd apps/web && npm run dev

   # Terminal 2 — ML service
   cd services/ml && uvicorn app.main:app --reload --port 8000
   ```

## Development Guidelines

- Follow existing TypeScript and Python conventions in the codebase.
- Keep changes focused — one feature or fix per pull request.
- Ensure `npm run build` and `npm run typecheck` pass in `apps/web`.
- Do not commit secrets, `.env` files, `node_modules`, or build artifacts.

## Pull Request Process

1. Create a feature branch from `main`.
2. Write clear commit messages describing the *why*, not just the *what*.
3. Update documentation if your change affects APIs, architecture, or setup.
4. Open a pull request with a concise summary and test plan.

---

(c) 2026 Abdulaziz AlAmawi
