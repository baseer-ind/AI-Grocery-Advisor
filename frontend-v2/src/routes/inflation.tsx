import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/inflation")({
  beforeLoad: () => {
    throw redirect({ to: "/home" });
  },
});
