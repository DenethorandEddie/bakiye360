'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useAnalytics } from '@/hooks/useAnalytics';

interface ExampleButtonProps {
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  eventName?: string;
  eventCategory?: string;
}

export function ExampleButton({
  children,
  variant = 'default',
  size = 'default',
  eventName = 'button_click',
  eventCategory = 'engagement',
}: ExampleButtonProps) {
  const { trackEvent } = useAnalytics();

  const handleClick = () => {
    // Google Analytics özel olayını izle
    trackEvent(eventName, {
      category: eventCategory,
      label: typeof children === 'string' ? children : 'button',
    });
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
    >
      {children}
    </Button>
  );
} 