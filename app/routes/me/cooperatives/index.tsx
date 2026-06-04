import CooperativesPage from "~/components/pages/cooperatives/cooperatives-page";

export function meta() {
  return [{ title: "Cooperatives | M&E" }];
}

export default function MeCooperativesPage() {
  return <CooperativesPage role="me" />;
}
