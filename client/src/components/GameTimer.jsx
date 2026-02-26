import { useState, useEffect, memo } from "react";
import { useTranslation } from "react-i18next";

const GameTimer = memo(function GameTimer({ roundEndsAt, className }) {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const tick = setInterval(() => {
      if (!roundEndsAt) {
        setTimeLeft(0);
        return;
      }
      // Use ceil to show 1s even if 0.1s left, feels better
      const left = Math.max(0, Math.ceil((roundEndsAt - Date.now()) / 1000));
      setTimeLeft(left);
    }, 1000); // Update every second instead of 300ms to reduce renders

    // Initial update
    if (roundEndsAt) {
      setTimeLeft(Math.max(0, Math.ceil((roundEndsAt - Date.now()) / 1000)));
    } else {
      setTimeLeft(0);
    }

    return () => clearInterval(tick);
  }, [roundEndsAt]);

  return (
    <span className={className} aria-live="polite">
      {t('ui.remainingTime')}：{timeLeft}s
    </span>
  );
});

export default GameTimer;
