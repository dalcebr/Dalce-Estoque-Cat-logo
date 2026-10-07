import { Mail } from "lucide-react";
import LoginForm from "./LoginForm";
export default function LoginPage() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center bg-page px-6">
      <a href="mailto:suporte@dalce.app" className="absolute right-5 top-[max(1.25rem,env(safe-area-inset-top))] flex items-center gap-1.5 text-sm font-medium text-navy">
        <Mail size={18} /> Suporte
      </a>
      <div className="w-full max-w-sm text-center">
        <h1 className="text-4xl font-bold text-ink">Dalce Estoque</h1>
        <p className="mt-2 text-muted">Seu negócio mais organizado e lucrativo</p>
        <LoginForm />
      </div>
    </main>
  );
}
