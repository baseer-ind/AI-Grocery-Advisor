import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/discovery")({
  beforeLoad: () => {
    throw redirect({ to: "/household" });
  },
});
