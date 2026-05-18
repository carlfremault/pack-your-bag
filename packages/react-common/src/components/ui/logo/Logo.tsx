export function Logo() {
  return (
    <div className="relative inline-block pr-8">
      <div className="from-primary to-accent inline-block bg-linear-to-r bg-clip-text text-lg font-bold text-transparent">
        PackYourBag!
      </div>
      <span className="bg-accent-emphasis text-accent-foreground border-accent-ring absolute right-0 bottom-0 translate-x-1/3 translate-y-1/3 rounded-full border px-1.5 py-0.5 text-[10px] leading-none font-extrabold tracking-wide shadow-sm">
        BETA
      </span>
    </div>
  );
}
