import React from 'react';
import { Calculator, BarChart3 } from 'lucide-react';

const Navigation = ({ activeTab, setActiveTab }) => {
  const tabs = [
    {
      id: 'voting-game',
      label: 'Weighted Voting Game Calculator',
      icon: Calculator,
      description: 'Compute Shapley and Banzhaf values'
    },
    {
      id: 'single-peaked',
      label: 'Single-Peaked Preference Checker',
      icon: BarChart3,
      description: 'Analyze preference profiles for single-peakedness'
    }
  ];

  return (
    <nav className="navigation">
      <div className="nav-container">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <div className="nav-tab-content">
                <Icon className="nav-icon" />
                <div className="nav-text">
                  <span className="nav-label">{tab.label}</span>
                  <span className="nav-description">{tab.description}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;