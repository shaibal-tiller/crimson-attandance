import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';

export default function ThemeToggler({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'system' as const, label: 'System', icon: Monitor },
  ];

  return (
    <div className={cn("flex items-center p-1 bg-zinc-900/60 dark:bg-zinc-900/40 border border-glass-border rounded-xl shadow-inner", className)}>
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = theme === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            className={cn(
              "flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all duration-300 relative focus:outline-none active:scale-95",
              isActive 
                ? "bg-glass-accent text-white shadow-md shadow-glass-accent/20" 
                : "text-glass-text-muted hover:text-glass-text"
            )}
            title={`${opt.label} Theme`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline md:hidden lg:inline text-[10px] tracking-wide">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
