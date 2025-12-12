import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  id,
  className = "",
  ...props
}) => {
  const inputId = id || label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-2 mb-6">
      <label htmlFor={inputId} className="text-lg font-bold text-stone-800">
        {label}
      </label>
      <input
        id={inputId}
        className={`px-4 py-3 rounded-xl border-2 border-stone-300 bg-white text-lg text-stone-900 placeholder:text-stone-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all ${className}`}
        {...props}
      />
    </div>
  );
};
