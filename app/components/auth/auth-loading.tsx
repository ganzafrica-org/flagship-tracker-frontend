export default function AuthLoading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-[linear-gradient(180deg,#1f95c8_0%,#0f5872_100%)]">
      <img
        src="/images/coat-of-arms.svg"
        alt="Coat of Arms of Rwanda"
        className="h-20 w-20 drop-shadow-lg"
      />
      <span className="text-2xl font-extrabold tracking-tight text-white">
        Flagship Tracker
      </span>
      <div className="flex gap-1.5 mt-2">
        <span className="h-2 w-2 rounded-full bg-white/70 animate-bounce [animation-delay:0ms]" />
        <span className="h-2 w-2 rounded-full bg-white/70 animate-bounce [animation-delay:150ms]" />
        <span className="h-2 w-2 rounded-full bg-white/70 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}
