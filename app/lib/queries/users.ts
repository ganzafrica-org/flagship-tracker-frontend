import { queryOptions } from "@tanstack/react-query";

export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "me" | "senior";
}

const DUMMY_USERS: User[] = [
  { id: 1, name: "Alice Moyo",   email: "alice@example.com", role: "admin"  },
  { id: 2, name: "Bob Dlamini",  email: "bob@example.com",   role: "me"     },
  { id: 3, name: "Carol Nkosi",  email: "carol@example.com", role: "senior" },
];

export const usersQueryOptions = queryOptions({
  queryKey: ["users"],
  // TODO: replace with api.get<User[]>("/api/users", undefined, signal)
  queryFn: () => Promise.resolve(DUMMY_USERS),
});
