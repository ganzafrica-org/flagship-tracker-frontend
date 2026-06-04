import CooperativesPage from "~/components/pages/cooperatives/cooperatives-page";

export function meta() {
  return [{ title: "Cooperatives | Senior Officials" }];
}

export default function SeniorCooperativesPage() {
  return <CooperativesPage role="senior" />;
}
