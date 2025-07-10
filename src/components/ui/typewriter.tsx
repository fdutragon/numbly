import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';

interface TypewriterProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
  startDelay?: number;
}

export function TypewriterText({
  text,
  speed = 30,
  onComplete,
  className = '',
  startDelay = 0,
}: TypewriterProps) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isStarted, setIsStarted] = useState(false);

  // Memoize the text to prevent unnecessary resets
  const memoizedText = useMemo(() => text, [text]);

  const handleComplete = useCallback(() => {
    if (onComplete) {
      onComplete();
    }
  }, [onComplete]);

  // Reset when text changes
  useEffect(() => {
    setDisplayText('');
    setCurrentIndex(0);
    setIsStarted(false);

    if (startDelay > 0) {
      const startTimeout = setTimeout(() => setIsStarted(true), startDelay);
      return () => clearTimeout(startTimeout);
    } else {
      setIsStarted(true);
    }
  }, [memoizedText, startDelay]);

  // Typing effect
  useEffect(() => {
    if (!isStarted || currentIndex >= memoizedText.length) {
      if (isStarted && currentIndex >= memoizedText.length && onComplete) {
        handleComplete();
      }
      return;
    }

    const timeout = setTimeout(() => {
      setDisplayText(prev => prev + memoizedText[currentIndex]);
      setCurrentIndex(prev => prev + 1);
    }, speed);

    return () => clearTimeout(timeout);
  }, [
    currentIndex,
    memoizedText,
    speed,
    isStarted,
    handleComplete,
    onComplete,
  ]);

  const showCursor = currentIndex < memoizedText.length && isStarted;

  return (
    <span className={className}>
      {displayText}
      {showCursor && (
        <motion.span
          className="inline-block ml-1"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        >
          |
        </motion.span>
      )}
    </span>
  );
}
