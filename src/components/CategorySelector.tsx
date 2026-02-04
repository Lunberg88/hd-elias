import React from 'react';
import { Category } from '../types';

interface CategorySelectorProps {
  categories: Category[];
  selectedCategories: string[];
  onToggleCategory: (categoryId: string) => void;
  onSelectAll: () => void;
  multiple?: boolean;
}

export function CategorySelector({
  categories,
  selectedCategories,
  onToggleCategory,
  onSelectAll,
  multiple = true,
}: CategorySelectorProps) {
  const allSelected = selectedCategories.length === categories.length;

  return (
    <div className="space-y-4">
      {multiple && (
        <div className="flex justify-between items-center mb-4">
          <span className="text-white/60">
            Обрано: {selectedCategories.length} з {categories.length}
          </span>
          <button
            onClick={onSelectAll}
            className="btn-secondary text-sm px-4 py-2"
          >
            {allSelected ? 'Зняти всі' : 'Обрати всі'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => {
          const isSelected = selectedCategories.includes(category.id);

          return (
            <button
              key={category.id}
              onClick={() => onToggleCategory(category.id)}
              className={`category-card ${isSelected ? 'selected' : ''}`}
            >
              <div className="text-4xl mb-3">{category.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{category.name}</h3>
              <p className="text-sm text-white/60">
                {category.words.length} слів
              </p>
              {isSelected && (
                <div className="mt-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-purple-500 rounded-full">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
