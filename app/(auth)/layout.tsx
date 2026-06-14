export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0B0F]"
         style={{ backgroundImage: "radial-gradient(ellipse at 50% 0%, rgba(108,99,255,0.07) 0%, transparent 60%)" }}>
      {children}
    </div>
  );
}
