import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      <div className="mb-8 shrink-0">
        <h2 className="text-2xl font-bold tracking-tight text-primary mb-1">Settings</h2>
        <p className="text-sm text-muted">Manage your workspace preferences, core models and billing configurations.</p>
      </div>

      <div className="bg-[#111820] border border-[#1a2332] rounded-md max-w-3xl">
         <div className="px-6 py-5 border-b border-[#1a2332]">
           <h3 className="font-semibold text-primary">Workspace Profile</h3>
         </div>
         <div className="p-6 space-y-6">
           <div>
             <label className="block text-sm font-medium text-primary mb-2">Startup Name</label>
             <input 
               type="text" 
               defaultValue="FounderOS HQ"
               className="w-full bg-[#080b10] border border-[#1a2332] rounded-md px-3 py-2 text-sm text-primary focus:outline-none focus:border-[#0ea5e9]"
             />
           </div>
           <div>
             <label className="block text-sm font-medium text-primary mb-2">Investor Email Copy</label>
             <input 
               type="text" 
               placeholder="investors@yourstartup.com"
               className="w-full bg-[#080b10] border border-[#1a2332] rounded-md px-3 py-2 text-sm text-primary focus:outline-none focus:border-[#0ea5e9]"
             />
           </div>
           
           <div className="pt-4 border-t border-[#1a2332] flex justify-end">
             <button className="bg-gradient-to-br from-[#0ea5e9] to-[#8b5cf6] text-white text-sm font-semibold tracking-wider uppercase px-4 py-2 rounded">
               Save Changes
             </button>
           </div>
         </div>
      </div>
    </div>
  );
}
