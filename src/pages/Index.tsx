import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { tokenStorage } from "@/lib/token-storage";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (tokenStorage.isAuthenticated()) {
      const tipo = tokenStorage.getUserType();
      switch (tipo) {
        case "EMPRESA": navigate("/empresa", { replace: true }); break;
        case "FUNCIONARIO": navigate("/funcionario", { replace: true }); break;
        case "ADMIN": navigate("/admin", { replace: true }); break;
        default: navigate("/login", { replace: true });
      }
    } else {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  return null;
};

export default Index;
