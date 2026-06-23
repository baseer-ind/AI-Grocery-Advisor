import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/basket")({
  beforeLoad: () => {
    throw redirect({ to: "/bill-check" });
  },
});
