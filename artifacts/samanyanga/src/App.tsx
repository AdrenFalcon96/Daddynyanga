import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import AdminLogin from "@/pages/AdminLogin";
import PublicAds from "@/pages/PublicAds";
import AdvertDetail from "@/pages/AdvertDetail";
import Farmer from "@/pages/Farmer";
import Buyer from "@/pages/Buyer";
import Seller from "@/pages/Seller";
import StudentCompanion from "@/pages/StudentCompanion";
import Admin from "@/pages/Admin";
import AgriIntern from "@/pages/AgriIntern";
import Consultation from "@/pages/Consultation";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Login} />
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/consultation" component={Consultation} />
      <Route path="/public-ads" component={PublicAds} />
      <Route path="/adverts/:id" component={AdvertDetail} />
      <Route path="/farmer" component={Farmer} />
      <Route path="/buyer" component={Buyer} />
      <Route path="/seller" component={Seller} />
      <Route path="/student-companion" component={StudentCompanion} />
      <Route path="/admin" component={Admin} />
      <Route path="/agri-intern" component={AgriIntern} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
