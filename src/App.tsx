import React, { useState } from 'react';
import VotingGameCalculator from './components/VotingGameCalculator';
import SinglePeakedChecker from './components/SinglePeakedChecker';
import Navigation from './components/Navigation';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('voting-game');

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'voting-game':
        return <VotingGameCalculator />;
      case 'single-peaked':
        return <SinglePeakedChecker />;
      default:
        return <VotingGameCalculator />;
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">
          <strong>collective-decision-making</strong>
        </h1>
        <p className="app-subtitle">Tools for analyzing voting systems and preference structures</p>
      </header>
      
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="app-main">
        {renderActiveComponent()}
      </main>
    </div>
  );
}

export default App;