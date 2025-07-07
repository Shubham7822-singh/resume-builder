import React from 'react';

const Tabs = ({ tabs = [], activeTab, setActiveTab }) => {
  if (!Array.isArray(tabs)) {
    console.error('Tabs component expected "tabs" to be an array, got:', typeof tabs);
    return null;
  }

  return (
    <div className="flex space-x-4 flex-wrap">
      {tabs.map((tab, index) => (
        <button
          key={index}
          onClick={() => setActiveTab(tab.label)}
          className={`px-4 py-2 font-semibold rounded-full transition-all ${
            activeTab === tab.label
              ? 'bg-violet-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
