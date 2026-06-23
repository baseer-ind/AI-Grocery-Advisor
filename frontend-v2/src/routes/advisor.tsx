import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/advisor")({
  beforeLoad: () => {
    throw redirect({ to: "/home" });
  },
});
