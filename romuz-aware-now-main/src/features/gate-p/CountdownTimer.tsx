import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  targetDate: string;
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export function CountdownTimer({ targetDate, className = "" }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

  function calculateTimeLeft(): TimeLeft {
    const difference = new Date(targetDate).getTime() - new Date().getTime();
    
    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      total: difference,
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  // If time has passed
  if (timeLeft.total <= 0) {
    return (
      <div className={`flex items-center gap-1 text-xs text-muted-foreground ${className}`}>
        <Clock className="h-3 w-3" />
        <span>Time Expired</span>
      </div>
    );
  }

  // Format display based on time remaining
  const getFormattedTime = () => {
    const parts: string[] = [];

    if (timeLeft.days > 0) {
      parts.push(`${timeLeft.days} ${timeLeft.days === 1 ? 'day' : 'days'}`);
    }
    if (timeLeft.hours > 0 || timeLeft.days > 0) {
      parts.push(`${timeLeft.hours} ${timeLeft.hours === 1 ? 'hour' : 'hours'}`);
    }
    if (timeLeft.days === 0) {
      parts.push(`${timeLeft.minutes} ${timeLeft.minutes === 1 ? 'minute' : 'minutes'}`);
    }
    if (timeLeft.days === 0 && timeLeft.hours === 0) {
      parts.push(`${timeLeft.seconds} ${timeLeft.seconds === 1 ? 'second' : 'seconds'}`);
    }

    return parts.join(' and ');
  };

  // Color coding based on urgency
  const getUrgencyColor = () => {
    const totalHours = timeLeft.total / (1000 * 60 * 60);
    
    if (totalHours < 1) return "text-destructive font-medium"; // Less than 1 hour - red
    if (totalHours < 24) return "text-orange-600 dark:text-orange-400 font-medium"; // Less than 1 day - orange
    if (totalHours < 72) return "text-yellow-600 dark:text-yellow-400"; // Less than 3 days - yellow
    return "text-muted-foreground"; // More than 3 days - normal
  };

  return (
    <div className={`flex items-center gap-1 text-xs ${getUrgencyColor()} ${className}`}>
      <Clock className="h-3 w-3 animate-pulse" />
      <span>Remaining: {getFormattedTime()}</span>
    </div>
  );
}
