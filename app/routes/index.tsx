import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getStoredUser, getRoleHomePath } from "~/lib/auth";
import AuthLoading from "~/components/auth/auth-loading";

export default function Index() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      navigate(getRoleHomePath(user.role), { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
    setChecking(false);
  }, [navigate]);

  if (checking) return <AuthLoading />;
  return null;
}
