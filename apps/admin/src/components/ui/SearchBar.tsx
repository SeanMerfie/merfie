import { useState, type KeyboardEvent, type ChangeEvent } from 'react';

interface SearchBarProps {
  placeholder?: string;
  defaultValue?: string;
}

const SearchBar = ({ placeholder = 'Search...', defaultValue = '' }: SearchBarProps) => {
  const [value, setValue] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('q') || defaultValue;
    }
    return defaultValue;
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const url = new URL(window.location.href);
      if (value.trim()) {
        url.searchParams.set('q', value.trim());
      } else {
        url.searchParams.delete('q');
      }
      window.location.href = url.toString();
    }
  };

  return (
    <label className="input">
      <svg className="h-4 w-4 opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="grow"
      />
    </label>
  );
};

export default SearchBar;
