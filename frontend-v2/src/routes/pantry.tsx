import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/pantry")({
  beforeLoad: () => {
    throw redirect({ to: "/this-week" });
  },
});
