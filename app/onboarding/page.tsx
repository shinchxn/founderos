import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { workspaces } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { completeOnboarding } from "./actions";
import { Building2, Briefcase, TrendingUp, ChevronRight } from "lucide-react";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Double check if they already completed it
  const ws = await db.query.workspaces.findFirst({
    where: eq(workspaces.owner_id, session.user.id)
  });

  if (ws?.setup_completed) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#080b10] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#0ea5e9]/10 rounded-xl flex items-center justify-center text-[#0ea5e9] font-bold text-xl mx-auto mb-4 border border-[#0ea5e9]/20">
            F
          </div>
          <h1 className="text-2xl font-bold text-primary mb-2">Welcome to FounderOS</h1>
          <p className="text-sm text-muted">Let's set up your workspace to get started.</p>
        </div>

        <div className="bg-[#111820] border border-[#1a2332] rounded-xl p-6 shadow-xl">
          <form action={completeOnboarding} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="companyName" className="text-sm font-medium text-primary flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted" /> Company Name
              </label>
              <input 
                type="text" 
                id="companyName"
                name="companyName" 
                required
                defaultValue={ws?.name !== "My Startup" ? ws?.name : ""}
                placeholder="e.g. Acme Corp" 
                className="w-full bg-[#080b10] border border-[#1a2332] rounded-md px-3 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="industry" className="text-sm font-medium text-primary flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-muted" /> Industry
              </label>
              <select 
                id="industry"
                name="industry" 
                required
                defaultValue=""
                className="w-full bg-[#080b10] border border-[#1a2332] rounded-md px-3 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent transition-all appearance-none"
              >
                <option value="" disabled>Select your industry</option>
                <option value="SaaS">B2B SaaS</option>
                <option value="E-commerce">E-commerce</option>
                <option value="Fintech">Fintech</option>
                <option value="Healthcare">Healthcare</option>
                <option value="AI/ML">AI / Machine Learning</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="stage" className="text-sm font-medium text-primary flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-muted" /> Startup Stage
              </label>
              <select 
                id="stage"
                name="stage" 
                required
                defaultValue=""
                className="w-full bg-[#080b10] border border-[#1a2332] rounded-md px-3 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent transition-all appearance-none"
              >
                <option value="" disabled>Select your current stage</option>
                <option value="Pre-seed">Pre-seed</option>
                <option value="Seed">Seed</option>
                <option value="Series A">Series A</option>
                <option value="Series B+">Series B+</option>
                <option value="Bootstrapped">Bootstrapped</option>
              </select>
            </div>

            <button 
              type="submit" 
              className="w-full bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-medium py-2.5 rounded-md transition-colors flex items-center justify-center gap-2 mt-4"
            >
              Complete Setup <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
