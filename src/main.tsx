import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import App from "./App";
import { EventsPage } from "./routes/EventsPage";
import { LogPage } from "./routes/LogPage";
import "./index.css";

const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/events", element: <EventsPage /> },
  { path: "/log", element: <LogPage /> },
]);

createRoot(document.getElementById("root")!).render(
  <RouterProvider router={router} />
);
