import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border bg-card p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Zap className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">CommandField</h1>
          </div>
          <p className="text-sm text-muted-foreground">Field service management, simplified.</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Email</label>
            <Input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background border-border text-foreground"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-background border-border text-foreground"
            />
          </div>
          <Button className="w-full" onClick={() => navigate("/dashboard")}>
            Sign In
          </Button>
        </div>

        <div className="text-center space-y-2">
          <button className="text-sm text-primary hover:underline">Forgot password?</button>
          <p className="text-xs text-muted-foreground">
            New to CommandField? Contact your admin for access.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
