import { useRef } from 'react';

type AnyFunction = (...args: unknown[]) => void;

const useDebounce = () => {
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debounce = <T extends AnyFunction>(
    func: T,
    delay: number,
    ...args: Parameters<T>
  ): void => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      func(...args);
      debounceTimeout.current = null;
    }, delay);
  };

  return debounce;
};

export default useDebounce;
