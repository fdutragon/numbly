'use client';

import { useState, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  className?: string;
  required?: boolean;
}

// Input de data brasileiro (DD/MM/AAAA)
export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ value, onChange, placeholder = 'DD/MM/AAAA', error, className, required, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState(value || '');

    const formatInput = (input: string): string => {
      // Remove tudo que não é número
      const numbers = input.replace(/\D/g, '');
      
      if (numbers.length === 0) return '';
      if (numbers.length <= 2) return numbers;
      if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
      
      // Limita a 8 dígitos (DDMMAAAA)
      const limited = numbers.slice(0, 8);
      return `${limited.slice(0, 2)}/${limited.slice(2, 4)}/${limited.slice(4)}`;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const formatted = formatInput(inputValue);
      
      setDisplayValue(formatted);
      
      // Só chama onChange quando tiver formato completo DD/MM/AAAA
      if (formatted.length === 10 && isValidDate(formatted)) {
        onChange(formatted);
      } else if (formatted === '') {
        onChange('');
      }
    };

    const isValidDate = (dateStr: string): boolean => {
      if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return false;
      
      const [day, month, year] = dateStr.split('/').map(Number);
      
      if (month < 1 || month > 12) return false;
      if (day < 1 || day > 31) return false;
      if (year < 1900 || year > new Date().getFullYear()) return false;
      
      // Validação básica de dias por mês
      const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      if (month === 2 && isLeapYear(year)) daysInMonth[1] = 29;
      
      return day <= daysInMonth[month - 1];
    };

    const isLeapYear = (year: number): boolean => {
      return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    };

    return (
      <div className="relative">
        <input
          ref={ref}
          type="text"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          maxLength={10}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus-visible:ring-red-500",
            className
          )}
          {...props}
        />
        
        {/* Indicador de formato válido */}
        {displayValue.length === 10 && isValidDate(displayValue) && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <span className="text-green-500 text-sm">✓</span>
          </div>
        )}
        
        {/* Indicador de formato inválido */}
        {displayValue.length === 10 && !isValidDate(displayValue) && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <span className="text-red-500 text-sm">✗</span>
          </div>
        )}
      </div>
    );
  }
);

DateInput.displayName = 'DateInput';
