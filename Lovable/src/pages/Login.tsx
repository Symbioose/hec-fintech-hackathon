import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";

export default function Login() {
  const { signIn, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("marcus@nordlyswealth.com");
  const [password, setPassword] = useState("demo");

  if (isAuthenticated) return <Navigate to="/" replace />;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    signIn(email || "marcus@nordlyswealth.com");
    navigate("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-accent text-primary-foreground shadow-elevated">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">StructuredMatch</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to your asset manager workspace
            </p>
          </div>
        </div>

        <Card className="shadow-elevated">
          <CardContent className="p-6">
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@firm.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <Button type="submit" className="w-full">
                Sign in
              </Button>
              <p className="text-center text-[11px] text-muted-foreground">
                Demo build — any credentials are accepted. You'll sign in as Marcus Lindqvist (Nordlys Wealth).
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
