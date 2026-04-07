import { queryOptions } from "@tanstack/react-query";

// Shape returned by the backend — extend as the API is implemented
export interface Flagship {
  id: number;
  name: string;
  status: "active" | "inactive" | "pending";
  lead: string;
  progress: number;
}

const DUMMY_FLAGSHIPS: Flagship[] = [
  { id: 1,  name: "Project Alpha",    status: "active",   lead: "Alice Moyo",    progress: 72 },
  { id: 2,  name: "Project Beta",     status: "active",   lead: "Bob Dlamini",   progress: 45 },
  { id: 3,  name: "Project Gamma",    status: "pending",  lead: "Carol Nkosi",   progress: 10 },
  { id: 4,  name: "Project Delta",    status: "active",   lead: "David Sithole", progress: 88 },
  { id: 5,  name: "Project Epsilon",  status: "inactive", lead: "Eve Khumalo",   progress: 100 },
  { id: 6,  name: "Project Zeta",     status: "active",   lead: "Frank Ndlovu",  progress: 60 },
  { id: 7,  name: "Project Eta",      status: "pending",  lead: "Grace Dube",    progress: 25 },
  { id: 8,  name: "Project Theta",    status: "active",   lead: "Henry Zulu",    progress: 55 },
  { id: 9,  name: "Project Iota",     status: "inactive", lead: "Irene Mthembu", progress: 100 },
  { id: 10, name: "Project Kappa",    status: "active",   lead: "James Mhlongo", progress: 38 },
  { id: 11, name: "Project Lambda",   status: "active",   lead: "Karen Hadebe",  progress: 67 },
  { id: 12, name: "Project Mu",       status: "pending",  lead: "Leo Cele",      progress: 5  },
];

export const flagshipsQueryOptions = queryOptions({
  queryKey: ["flagships"],
  // TODO: replace with api.get<Flagship[]>("/api/flagships", undefined, signal)
  queryFn: () => Promise.resolve(DUMMY_FLAGSHIPS),
});

export const flagshipQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["flagships", id],
    // TODO: replace with api.get<Flagship>(`/api/flagships/${id}`, undefined, signal)
    queryFn: () =>
      Promise.resolve(DUMMY_FLAGSHIPS.find((f) => f.id === id) ?? null),
  });
