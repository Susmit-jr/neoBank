import { useState } from "react";

type IndusIndLogoProps = {
  className?: string;
};

// Uses the official logo when it is placed at public/indusind-bank-logo.png,
// otherwise falls back to a text wordmark in the bank's colours.
function IndusIndLogo({ className = "h-7" }: IndusIndLogoProps) {
  const [hasLogoFile, setHasLogoFile] = useState(true);

  if (hasLogoFile) {
    return (
      <img
        src="/indusind-bank-logo.png"
        alt="IndusInd Bank"
        className={className}
        onError={() => setHasLogoFile(false)}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label="IndusInd Bank"
      className="inline-flex items-center gap-2"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#9c3238] text-lg font-black leading-none text-white">
        I
      </span>
      <span className="leading-none">
        <span className="block text-lg font-extrabold tracking-tight text-[#9c3238]">
          IndusInd
        </span>
        <span className="block text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
          Bank
        </span>
      </span>
    </span>
  );
}

export default IndusIndLogo;
