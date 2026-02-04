import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Category, Word } from '../types';
import { Modal } from '../components';
import defaultWordsData from '../data/words.json';

const STORAGE_KEY = 'elias-words-data';

export function Admin() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showWordModal, setShowWordModal] = useState(false);
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [editingWordIndex, setEditingWordIndex] = useState<number>(-1);

  // Form states
  const [categoryForm, setCategoryForm] = useState({ name: '', icon: '' });
  const [wordForm, setWordForm] = useState({ word: '', hint: '' });
  const [searchQuery, setSearchQuery] = useState('');

  // Load data from localStorage or use default
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCategories(parsed.categories);
      } catch {
        setCategories(defaultWordsData.categories as Category[]);
      }
    } else {
      setCategories(defaultWordsData.categories as Category[]);
    }
  }, []);

  // Save data to localStorage
  const saveData = (newCategories: Category[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ categories: newCategories }));
    setCategories(newCategories);
  };

  // Category operations
  const handleAddCategory = () => {
    if (!categoryForm.name.trim()) return;

    const newCategory: Category = {
      id: `category-${Date.now()}`,
      name: categoryForm.name.trim(),
      icon: categoryForm.icon || '📁',
      words: [],
    };

    saveData([...categories, newCategory]);
    setCategoryForm({ name: '', icon: '' });
    setShowCategoryModal(false);
  };

  const handleEditCategory = () => {
    if (!selectedCategory || !categoryForm.name.trim()) return;

    const updated = categories.map((c) =>
      c.id === selectedCategory.id
        ? { ...c, name: categoryForm.name.trim(), icon: categoryForm.icon || c.icon }
        : c
    );

    saveData(updated);
    setSelectedCategory({ ...selectedCategory, name: categoryForm.name.trim(), icon: categoryForm.icon || selectedCategory.icon });
    setCategoryForm({ name: '', icon: '' });
    setShowCategoryModal(false);
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (!window.confirm('Ви впевнені, що хочете видалити цю категорію?')) return;

    const updated = categories.filter((c) => c.id !== categoryId);
    saveData(updated);

    if (selectedCategory?.id === categoryId) {
      setSelectedCategory(null);
    }
  };

  // Word operations
  const handleAddWord = () => {
    if (!selectedCategory || !wordForm.word.trim()) return;

    const newWord: Word = {
      word: wordForm.word.trim(),
      hint: wordForm.hint.trim(),
    };

    const updated = categories.map((c) =>
      c.id === selectedCategory.id
        ? { ...c, words: [...c.words, newWord] }
        : c
    );

    saveData(updated);
    setSelectedCategory({
      ...selectedCategory,
      words: [...selectedCategory.words, newWord],
    });
    setWordForm({ word: '', hint: '' });
    setShowWordModal(false);
  };

  const handleEditWord = () => {
    if (!selectedCategory || editingWordIndex < 0 || !wordForm.word.trim()) return;

    const updatedWords = [...selectedCategory.words];
    updatedWords[editingWordIndex] = {
      word: wordForm.word.trim(),
      hint: wordForm.hint.trim(),
    };

    const updated = categories.map((c) =>
      c.id === selectedCategory.id ? { ...c, words: updatedWords } : c
    );

    saveData(updated);
    setSelectedCategory({ ...selectedCategory, words: updatedWords });
    setWordForm({ word: '', hint: '' });
    setEditingWord(null);
    setEditingWordIndex(-1);
    setShowWordModal(false);
  };

  const handleDeleteWord = (wordIndex: number) => {
    if (!selectedCategory) return;
    if (!window.confirm('Ви впевнені, що хочете видалити це слово?')) return;

    const updatedWords = selectedCategory.words.filter((_, i) => i !== wordIndex);

    const updated = categories.map((c) =>
      c.id === selectedCategory.id ? { ...c, words: updatedWords } : c
    );

    saveData(updated);
    setSelectedCategory({ ...selectedCategory, words: updatedWords });
  };

  const openEditWord = (word: Word, index: number) => {
    setEditingWord(word);
    setEditingWordIndex(index);
    setWordForm({ word: word.word, hint: word.hint });
    setShowWordModal(true);
  };

  const openAddWord = () => {
    setEditingWord(null);
    setEditingWordIndex(-1);
    setWordForm({ word: '', hint: '' });
    setShowWordModal(true);
  };

  const openEditCategory = (category: Category) => {
    setCategoryForm({ name: category.name, icon: category.icon });
    setShowCategoryModal(true);
  };

  const openAddCategory = () => {
    setSelectedCategory(null);
    setCategoryForm({ name: '', icon: '' });
    setShowCategoryModal(true);
  };

  // Export/Import
  const handleExport = () => {
    const dataStr = JSON.stringify({ categories }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'elias-words-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (parsed.categories && Array.isArray(parsed.categories)) {
          saveData(parsed.categories);
          alert('Дані успішно імпортовано!');
        } else {
          alert('Невірний формат файлу');
        }
      } catch {
        alert('Помилка читання файлу');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleResetToDefault = () => {
    if (!window.confirm('Ви впевнені? Всі ваші зміни буде втрачено!')) return;
    localStorage.removeItem(STORAGE_KEY);
    setCategories(defaultWordsData.categories as Category[]);
    setSelectedCategory(null);
  };

  // Filter words by search
  const filteredWords = selectedCategory?.words.filter(
    (w) =>
      w.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.hint.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const totalWords = categories.reduce((sum, c) => sum + c.words.length, 0);

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <button
              onClick={() => navigate('/')}
              className="text-white/60 hover:text-white mb-2 flex items-center gap-1"
            >
              ← На головну
            </button>
            <h1 className="text-3xl font-bold">⚙️ Адмін-панель</h1>
            <p className="text-white/60 mt-1">
              {categories.length} категорій · {totalWords} слів
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={handleExport} className="btn-secondary text-sm">
              📤 Експорт
            </button>
            <label className="btn-secondary text-sm cursor-pointer">
              📥 Імпорт
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
            <button
              onClick={handleResetToDefault}
              className="btn-danger text-sm"
            >
              🔄 Скинути
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Categories List */}
          <div className="lg:col-span-1">
            <div className="card p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Категорії</h2>
                <button
                  onClick={openAddCategory}
                  className="btn-primary text-sm px-3 py-1"
                >
                  + Додати
                </button>
              </div>

              <div className="space-y-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                      selectedCategory?.id === category.id
                        ? 'bg-purple-500/30 ring-2 ring-purple-400'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{category.icon}</span>
                      <div>
                        <p className="font-medium">{category.name}</p>
                        <p className="text-sm text-white/60">
                          {category.words.length} слів
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCategory(category);
                          openEditCategory(category);
                        }}
                        className="p-2 hover:bg-white/10 rounded-lg"
                        title="Редагувати"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(category.id);
                        }}
                        className="p-2 hover:bg-red-500/20 rounded-lg"
                        title="Видалити"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}

                {categories.length === 0 && (
                  <p className="text-center text-white/40 py-8">
                    Немає категорій
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Words List */}
          <div className="lg:col-span-2">
            <div className="card p-4">
              {selectedCategory ? (
                <>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{selectedCategory.icon}</span>
                      <div>
                        <h2 className="text-xl font-semibold">
                          {selectedCategory.name}
                        </h2>
                        <p className="text-sm text-white/60">
                          {selectedCategory.words.length} слів
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={openAddWord}
                      className="btn-success text-sm"
                    >
                      + Додати слово
                    </button>
                  </div>

                  {/* Search */}
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="🔍 Пошук слів..."
                    className="input mb-4"
                  />

                  {/* Words Table */}
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                    {filteredWords?.map((word, index) => (
                      <div
                        key={index}
                        className="flex items-start justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all"
                      >
                        <div className="flex-1 mr-4">
                          <p className="font-semibold text-lg">{word.word}</p>
                          <p className="text-sm text-white/60 mt-1">
                            {word.hint || 'Без підказки'}
                          </p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => openEditWord(word, selectedCategory.words.indexOf(word))}
                            className="p-2 hover:bg-white/10 rounded-lg"
                            title="Редагувати"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteWord(selectedCategory.words.indexOf(word))}
                            className="p-2 hover:bg-red-500/20 rounded-lg"
                            title="Видалити"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}

                    {filteredWords?.length === 0 && (
                      <p className="text-center text-white/40 py-8">
                        {searchQuery
                          ? 'Нічого не знайдено'
                          : 'В цій категорії немає слів'}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-white/40">
                  <p className="text-4xl mb-4">👈</p>
                  <p>Оберіть категорію для редагування</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Category Modal */}
      <Modal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title={selectedCategory ? 'Редагувати категорію' : 'Нова категорія'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-2">
              Іконка (емодзі)
            </label>
            <input
              type="text"
              value={categoryForm.icon}
              onChange={(e) =>
                setCategoryForm({ ...categoryForm, icon: e.target.value })
              }
              placeholder="📁"
              className="input text-center text-2xl"
              maxLength={2}
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-2">
              Назва категорії
            </label>
            <input
              type="text"
              value={categoryForm.name}
              onChange={(e) =>
                setCategoryForm({ ...categoryForm, name: e.target.value })
              }
              placeholder="Введіть назву"
              className="input"
              autoFocus
            />
          </div>
          <button
            onClick={selectedCategory ? handleEditCategory : handleAddCategory}
            disabled={!categoryForm.name.trim()}
            className="btn-primary w-full"
          >
            {selectedCategory ? 'Зберегти' : 'Додати'}
          </button>
        </div>
      </Modal>

      {/* Word Modal */}
      <Modal
        isOpen={showWordModal}
        onClose={() => {
          setShowWordModal(false);
          setEditingWord(null);
          setEditingWordIndex(-1);
        }}
        title={editingWord ? 'Редагувати слово' : 'Нове слово'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-2">Слово</label>
            <input
              type="text"
              value={wordForm.word}
              onChange={(e) =>
                setWordForm({ ...wordForm, word: e.target.value })
              }
              placeholder="Введіть слово"
              className="input"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-2">Підказка</label>
            <textarea
              value={wordForm.hint}
              onChange={(e) =>
                setWordForm({ ...wordForm, hint: e.target.value })
              }
              placeholder="Введіть підказку для слова"
              className="input min-h-[100px] resize-none"
            />
          </div>
          <button
            onClick={editingWord ? handleEditWord : handleAddWord}
            disabled={!wordForm.word.trim()}
            className="btn-primary w-full"
          >
            {editingWord ? 'Зберегти' : 'Додати'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
