import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/stores")({
  beforeLoad: () => {
    throw redirect({ to: "/bill-check" });
  },
});
