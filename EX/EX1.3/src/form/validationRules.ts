import type { ValidationRule } from './form.types';

const emailPattern = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

export function required(message: string): ValidationRule {
  return (value) => value.trim() === '' ? message : undefined;
}

export function minLength(length: number, message: string): ValidationRule {
  return (value) => value.trim().length < length ? message : undefined;
}

export function email(message: string): ValidationRule {
  return (value) => emailPattern.test(value.trim()) ? undefined : message;
}
