import React from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { label: string; value: string }[];
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  id,
  className = "",
  ...props
}) => {
  const selectId = id || label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-2 mb-6">
      <label htmlFor={selectId} className="text-lg font-bold text-stone-800">
        {label}
      </label>

      <div className="relative">
        <select
          id={selectId}
          className={`appearance-none w-full px-4 py-3 rounded-xl border-2 border-stone-300 bg-white text-lg text-stone-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-stone-500">
          <svg className="h-5 w-5 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
    </div>
  );
};
