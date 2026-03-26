import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, Zap } from "lucide-react";

const steps = ["Business", "Team", "Customers", "Connect", "Launch"];

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [smsSent, setSmsSent] = useState(false);

  const next = () => setStep((s) => Math.min(s + 1, 4));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg rounded-lg border bg-card p-8 space-y-6">
        <div className="flex items-center gap-2 justify-center">
          <Zap className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">CommandField Setup</h1>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            {steps.map((s, i) => (
              <span key={s} className={i <= step ? "text-primary font-medium" : ""}>{s}</span>
            ))}
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((step + 1) / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="space-y-4">
          {step === 0 && (
            <>
              <h2 className="text-lg font-semibold text-foreground">Business Info</h2>
              <Input placeholder="Business Name" className="bg-background border-border text-foreground" />
              <Input placeholder="Industry (e.g. HVAC, Plumbing)" className="bg-background border-border text-foreground" />
              <Input placeholder="Phone" className="bg-background border-border text-foreground" />
              <Input placeholder="Address" className="bg-background border-border text-foreground" />
              <Input placeholder="Timezone" className="bg-background border-border text-foreground" />
            </>
          )}
          {step === 1 && (
            <>
              <h2 className="text-lg font-semibold text-foreground">Add Team Members</h2>
              <p className="text-sm text-muted-foreground">Add up to 3 workers.</p>
              {[1, 2, 3].map((n) => (
                <div key={n} className="grid grid-cols-3 gap-2">
                  <Input placeholder="Name" className="bg-background border-border text-foreground" />
                  <Input placeholder="Phone" className="bg-background border-border text-foreground" />
                  <Input placeholder="Role" className="bg-background border-border text-foreground" />
                </div>
              ))}
            </>
          )}
          {step === 2 && (
            <>
              <h2 className="text-lg font-semibold text-foreground">Add Customers</h2>
              <p className="text-sm text-muted-foreground">Optional. Add up to 5 customers.</p>
              {[1, 2, 3, 4, 5].map((n) => (
                <Input key={n} placeholder={`Customer ${n} name`} className="bg-background border-border text-foreground" />
              ))}
            </>
          )}
          {step === 3 && (
            <>
              <h2 className="text-lg font-semibold text-foreground">Connect SMS</h2>
              <p className="text-sm text-muted-foreground">Your CommandField number:</p>
              <div className="text-2xl font-bold text-primary text-center">(979) 202-0380</div>
              <Button
                variant="outline"
                className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                onClick={() => setSmsSent(true)}
              >
                Send Test SMS
              </Button>
              {smsSent && (
                <div className="flex items-center gap-2 text-success text-sm justify-center">
                  <Check className="h-4 w-4" />
                  Test sent! Check your phone.
                </div>
              )}
            </>
          )}
          {step === 4 && (
            <>
              <h2 className="text-lg font-semibold text-foreground">Ready to Launch!</h2>
              <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground space-y-1">
                <p>✓ Business info configured</p>
                <p>✓ Team members added</p>
                <p>✓ Customer list ready</p>
                <p>✓ SMS connected</p>
              </div>
              <Button className="w-full" onClick={() => navigate("/dashboard")}>
                Go to Dashboard
              </Button>
            </>
          )}
        </div>

        {/* Nav buttons */}
        {step < 4 && (
          <div className="flex justify-between">
            <Button variant="ghost" onClick={back} disabled={step === 0} className="text-muted-foreground">
              Back
            </Button>
            <Button onClick={next}>Next</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
