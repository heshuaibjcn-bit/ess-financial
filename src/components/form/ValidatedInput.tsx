/**
 * ValidatedInput - Enhanced input component with validation
 *
 * Features:
 * - Real-time validation
 * - Error messages
 * - Help text
 * - Character count
 * - Validation status indicator
 */

import React, { useState, useEffect } from 'react';

export interface ValidationRule {
  validate: (value: string | number) => boolean;
  message: string;
}

interface ValidatedInputProps {
  label: string;
  value: string | number;
  onChange: (value: string | number) => void;
  type?: 'text' | 'number' | 'email' | 'tel';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  rules?: ValidationRule[];
  helpText?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  error?: string;
  showCharCount?: boolean;
  maxLength?: number;
}

export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
  disabled = false,
  rules = [],
  helpText,
  min,
  max,
  step,
  className = '',
  error: externalError,
  showCharCount = false,
  maxLength,
}) => {
  const [touched, setTouched] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  const displayError = externalError || internalError;
  const hasError = Boolean(displayError);

  // Validate input
  useEffect(() => {
    if (!touched) return;

    // Check required
    if (required && (value === '' || value === null || value === undefined)) {
      setInternalError('此字段为必填');
      return;
    }

    // Check min/max for numbers
    if (type === 'number') {
      const numValue = Number(value);
      if (min !== undefined && numValue < min) {
        setInternalError(`最小值为 ${min}`);
        return;
      }
      if (max !== undefined && numValue > max) {
        setInternalError(`最大值为 ${max}`);
        return;
      }
    }

    // Check max length
    if (maxLength && String(value).length > maxLength) {
      setInternalError(`最大长度为 ${maxLength}`);
      return;
    }

    // Run custom rules
    for (const rule of rules) {
      if (!rule.validate(value)) {
        setInternalError(rule.message);
        return;
      }
    }

    setInternalError(null);
  }, [value, touched, required, type, min, max, maxLength, rules]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    if (type === 'number') {
      const numValue = inputValue === '' ? '' : parseFloat(inputValue);
      onChange(numValue);
    } else {
      onChange(inputValue);
    }
  };

  const handleBlur = () => {
    setTouched(true);
  };

  const inputId = `input-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className={`validated-input ${className}`}>
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        <input
          id={inputId}
          type={type}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          maxLength={maxLength}
          className={`
            w-full px-3 py-2 pr-10
            border rounded-lg
            text-sm
            transition-colors duration-200
            focus:outline-none focus:ring-2
            ${disabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
              : 'bg-white'
            }
            ${hasError
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500 text-red-900'
              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-gray-900'
            }
          `}
        />

        {/* Status indicator */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {touched && !hasError && value !== '' && (
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
          {hasError && (
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </div>

      {/* Help text */}
      {helpText && !hasError && (
        <p className="mt-1 text-xs text-gray-500 flex items-center">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          {helpText}
        </p>
      )}

      {/* Error message */}
      {hasError && (
        <p className="mt-1 text-xs text-red-600 flex items-center">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          {displayError}
        </p>
      )}

      {/* Character count */}
      {showCharCount && maxLength && (
        <p className="mt-1 text-xs text-gray-400 text-right">
          {String(value).length} / {maxLength}
        </p>
      )}
    </div>
  );
};

export default ValidatedInput;
