# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.



React + Vite File structure 

src/
│── assets/              # Images, icons, logos
│── components/          # Reusable UI components
│   ├── common/          # Buttons, Inputs, Cards
│   ├── layout/          # Navbar, Sidebar, Footer
│
│── pages/               # Full pages/screens
│   ├── Dashboard/
│   ├── Customers/
│   ├── Appointments/
│   ├── Services/
│   ├── Staff/
│   └── Reports/
│
│── routes/              # React Router setup
│── services/            # API calls / Axios
│── hooks/               # Custom hooks
│── context/             # Context API
│── utils/               # Helpers / functions
│── constants/           # Static values
│── styles/              # Global CSS
│── App.jsx
│── main.jsx