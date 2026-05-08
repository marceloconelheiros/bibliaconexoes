import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Planos from "./pages/Planos";
import MeusPlanos from "./pages/MeusPlanos";
import PlanoDetalhes from "./pages/PlanoDetalhes";
import Audios from "./pages/Audios";
import BibliaOnline from "./pages/BibliaOnline";
import EstudosEmpresarios from "./pages/EstudosEmpresarios";
import InstalarApp from "./pages/InstalarApp";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";

const AppRoutes = () => {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/planos" element={<Planos />} />
        <Route path="/meus-planos" element={<MeusPlanos />} />
        <Route path="/plano/:id" element={<PlanoDetalhes />} />
        <Route path="/audios" element={<Audios />} />
        <Route path="/biblia" element={<BibliaOnline />} />
        <Route path="/estudos-empresarios" element={<EstudosEmpresarios />} />
        <Route path="/instalar" element={<InstalarApp />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
