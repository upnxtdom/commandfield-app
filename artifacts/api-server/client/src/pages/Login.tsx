import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

const Login = () => {
  const navigate = useNavigate();
  const { setNavigate } = useAuth();

  useEffect(() => {
    setNavigate(navigate);
  }, [navigate, setNavigate]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error } = await
      supabase.auth.signInWithPassword(
        { email, password }
      );

    if (error) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }

    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border bg-card p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Zap className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">CommandField</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Field service management, simplified.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Email</label>
            <Input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background border-border text-foreground"
              required
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
              required
            />
          </div>
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
        <div className="text-center space-y-2">
          <button className="text-sm text-primary hover:underline">
            Forgot password?
          </button>
          <p className="text-xs text-muted-foreground">
            New to CommandField? Contact your admin for access.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
