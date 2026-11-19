import { useEffect, useState } from 'react';

export default function AutoDismissNotice({ children, watch, as = 'div', className = '', ...props }) {
  const [phase, setPhase] = useState({ watch, visible: true, removed: false });
  const Element = as;
  const currentPhase = phase.watch === watch ? phase : { watch, visible: true, removed: false };

  useEffect(() => {
    let removeTimer;
    setPhase({ watch, visible: true, removed: false });

    const dismissTimer = window.setTimeout(() => {
      setPhase((current) => current.watch === watch ? { ...current, visible: false } : current);
      removeTimer = window.setTimeout(() => {
        setPhase((current) => current.watch === watch ? { ...current, removed: true } : current);
      }, 300);
    }, 3500);

    return () => {
      window.clearTimeout(dismissTimer);
      if (removeTimer) window.clearTimeout(removeTimer);
    };
  }, [watch]);

  if (currentPhase.removed) return null;

  return (
    <Element {...props} className={`transition-opacity duration-300 ease-in-out ${currentPhase.visible ? 'opacity-100' : 'opacity-0'} ${className}`}>
      {children}
    </Element>
  );
}
