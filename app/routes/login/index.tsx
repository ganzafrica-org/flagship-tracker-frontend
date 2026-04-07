import { Button, Card } from "@heroui/react";

import type { Route } from "./+types/index";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Login | Flagship Tracker" }];
}

export default function Login() {
  return (
    <main className="min-h-screen bg-(--background) text-(--foreground) flex items-center justify-center">
      <Card className="w-full max-w-sm">
        <Card.Header>
          <Card.Title>Sign in</Card.Title>
          <Card.Description>Placeholder — wire up auth here.</Card.Description>
        </Card.Header>
        <Card.Footer>
          <Button variant="primary" fullWidth onPress={() => {}}>
            Sign in
          </Button>
        </Card.Footer>
      </Card>
    </main>
  );
}
