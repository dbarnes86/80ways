import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function Onboard() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const handleComplete = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8 glow-cyan">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-mono transition-smooth ${
                    i <= step
                      ? "bg-primary text-primary-foreground glow-cyan"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < step ? <Check className="w-5 h-5" /> : i}
                </div>
                {i < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-smooth ${
                      i < step ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <h2 className="text-2xl font-heading text-center">
            {step === 1 && "Welcome, Adventurer"}
            {step === 2 && "Personal Details"}
            {step === 3 && "Fitness Profile"}
            {step === 4 && "Choose Your Plan"}
          </h2>
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-muted-foreground text-center mb-6">
                Prepare to embark on the greatest fitness adventure of 2084
              </p>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Email Address</label>
                  <Input type="email" placeholder="explorer@ludis.com" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Password</label>
                  <Input type="password" placeholder="Enter secure password" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Full Name</label>
                <Input placeholder="Phileas Fogg" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Age</label>
                <Input type="number" placeholder="25" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Location</label>
                <Input placeholder="London, England" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Current Fitness Level</label>
                <select className="w-full px-3 py-2 bg-input border border-border rounded-lg">
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                  <option>Elite</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Primary Activity</label>
                <select className="w-full px-3 py-2 bg-input border border-border rounded-lg">
                  <option>Running</option>
                  <option>Cycling</option>
                  <option>Walking</option>
                  <option>Swimming</option>
                  <option>Mixed</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Weekly Goal (km)</label>
                <Input type="number" placeholder="25" />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="p-6 border-2 border-muted hover:border-primary transition-smooth cursor-pointer">
                  <h3 className="text-xl font-heading mb-2">Explorer</h3>
                  <div className="text-3xl font-mono mb-4 text-primary">$9<span className="text-sm">/mo</span></div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>✓ Full journey access</li>
                    <li>✓ Stage challenges</li>
                    <li>✓ Basic boosters</li>
                  </ul>
                </Card>
                <Card className="p-6 border-2 border-primary glow-cyan cursor-pointer">
                  <div className="text-xs font-mono text-primary mb-2">RECOMMENDED</div>
                  <h3 className="text-xl font-heading mb-2">Adventurer</h3>
                  <div className="text-3xl font-mono mb-4 text-primary">$19<span className="text-sm">/mo</span></div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>✓ Everything in Explorer</li>
                    <li>✓ Raid participation</li>
                    <li>✓ Premium boosters</li>
                    <li>✓ Exclusive rewards</li>
                  </ul>
                </Card>
              </div>
            </div>
          )}
        </motion.div>

        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
          >
            <ArrowLeft className="mr-2" />
            Back
          </Button>
          <Button
            onClick={() => {
              if (step === 4) {
                handleComplete();
              } else {
                setStep(step + 1);
              }
            }}
            className="glow-cyan"
          >
            {step === 4 ? "Start Journey" : "Continue"}
            <ArrowRight className="ml-2" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
