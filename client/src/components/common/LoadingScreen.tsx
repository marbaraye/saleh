import { Code2 } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <Code2 className="w-16 h-16 text-primary-500 animate-pulse" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        </div>
        <p className="mt-4 text-dark-400">Chargement...</p>
      </div>
    </div>
  );
}
