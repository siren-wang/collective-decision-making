import React, { useState } from 'react';
import { Upload, Download, Info } from 'lucide-react';

const VotingGameCalculator = () => {
  const [k, setK] = useState(2);
  const [quotas, setQuotas] = useState([1, 1]);
  const [weights, setWeights] = useState([[1, 1], [1, 1]]);
  const [method, setMethod] = useState('shapley');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Update arrays when k changes
  const handleKChange = (newK) => {
    if (newK < 1 || newK > 20) return;
    setK(newK);
    
    // Adjust quotas array
    const newQuotas = [...quotas];
    while (newQuotas.length < newK) newQuotas.push(1);
    newQuotas.length = newK;
    setQuotas(newQuotas);
    
    // Adjust weights array
    const newWeights = [...weights];
    while (newWeights.length < newK) newWeights.push([1, 1]);
    newWeights.length = newK;
    setWeights(newWeights);
  };

  const handleQuotaChange = (index, value) => {
    const newQuotas = [...quotas];
    newQuotas[index] = Math.max(0, parseInt(value) || 0);
    setQuotas(newQuotas);
  };

  const handleWeightChange = (gameIndex, playerIndex, value) => {
    const newWeights = [...weights];
    newWeights[gameIndex][playerIndex] = Math.max(0, parseInt(value) || 0);
    setWeights(newWeights);
  };

  const addPlayer = (gameIndex) => {
    const newWeights = [...weights];
    newWeights[gameIndex].push(1);
    setWeights(newWeights);
  };

  const removePlayer = (gameIndex, playerIndex) => {
    if (weights[gameIndex].length <= 1) return;
    const newWeights = [...weights];
    newWeights[gameIndex].splice(playerIndex, 1);
    setWeights(newWeights);
  };

  // Generate all subsets of players
  const generateSubsets = (n) => {
    const subsets = [];
    for (let i = 0; i < (1 << n); i++) {
      const subset = [];
      for (let j = 0; j < n; j++) {
        if (i & (1 << j)) subset.push(j);
      }
      subsets.push(subset);
    }
    return subsets;
  };

  // Check if a coalition is winning
  const isWinning = (coalition, gameWeights, quota) => {
    const totalWeight = coalition.reduce((sum, player) => sum + gameWeights[player], 0);
    return totalWeight >= quota;
  };

  // Calculate Shapley values
  const calculateShapley = (gameWeights, quota) => {
    const n = gameWeights.length;
    const shapleyValues = new Array(n).fill(0);
    
    // For each player
    for (let player = 0; player < n; player++) {
      // For each possible coalition size
      for (let s = 0; s < n; s++) {
        // Generate all coalitions of size s not containing the player
        const otherPlayers = [...Array(n).keys()].filter(p => p !== player);
        const coalitions = generateSubsets(otherPlayers).filter(c => c.length === s);
        
        coalitions.forEach(coalition => {
          const withPlayer = [...coalition, player];
          const marginalContribution = 
            (isWinning(withPlayer, gameWeights, quota) ? 1 : 0) - 
            (isWinning(coalition, gameWeights, quota) ? 1 : 0);
          
          // Weight by factorial terms
          const weight = factorial(s) * factorial(n - s - 1) / factorial(n);
          shapleyValues[player] += weight * marginalContribution;
        });
      }
    }
    
    return shapleyValues;
  };

  // Calculate Banzhaf values
  const calculateBanzhaf = (gameWeights, quota) => {
    const n = gameWeights.length;
    const banzhafValues = new Array(n).fill(0);
    
    // For each player
    for (let player = 0; player < n; player++) {
      const otherPlayers = [...Array(n).keys()].filter(p => p !== player);
      const allCoalitions = generateSubsets(otherPlayers);
      
      allCoalitions.forEach(coalition => {
        const withPlayer = [...coalition, player];
        const marginalContribution = 
          (isWinning(withPlayer, gameWeights, quota) ? 1 : 0) - 
          (isWinning(coalition, gameWeights, quota) ? 1 : 0);
        
        banzhafValues[player] += marginalContribution;
      });
      
      // Normalize by total number of coalitions not containing the player
      banzhafValues[player] /= Math.pow(2, n - 1);
    }
    
    return banzhafValues;
  };

  // Factorial helper
  const factorial = (n) => {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
  };

  const calculateResults = () => {
    setLoading(true);
    setError('');
    
    try {
      const gameResults = weights.map((gameWeights, gameIndex) => {
        const quota = quotas[gameIndex];
        const values = method === 'shapley' 
          ? calculateShapley(gameWeights, quota)
          : calculateBanzhaf(gameWeights, quota);
        
        return {
          gameIndex: gameIndex + 1,
          quota,
          weights: gameWeights,
          values,
          totalWeight: gameWeights.reduce((sum, w) => sum + w, 0)
        };
      });
      
      setResults(gameResults);
    } catch (err) {
      setError('Error calculating values: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // CSV handling
  const handleCSVUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.trim().split('\n');
        
        // First line should be k
        const newK = parseInt(lines[0]);
        if (isNaN(newK) || newK < 1) throw new Error('Invalid k value');
        
        // Next k lines should be quotas
        const newQuotas = [];
        for (let i = 1; i <= newK; i++) {
          const quota = parseInt(lines[i]);
          if (isNaN(quota) || quota < 0) throw new Error(`Invalid quota at line ${i + 1}`);
          newQuotas.push(quota);
        }
        
        // Remaining lines should be weight vectors
        const newWeights = [];
        for (let i = newK + 1; i < lines.length && newWeights.length < newK; i++) {
          const weights = lines[i].split(',').map(w => parseInt(w.trim()));
          if (weights.some(w => isNaN(w) || w < 0)) {
            throw new Error(`Invalid weights at line ${i + 1}`);
          }
          newWeights.push(weights);
        }
        
        if (newWeights.length !== newK) {
          throw new Error('Number of weight vectors must equal k');
        }
        
        setK(newK);
        setQuotas(newQuotas);
        setWeights(newWeights);
        setError('');
      } catch (err) {
        setError('CSV parse error: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const exportResults = () => {
    if (!results) return;
    
    let csv = 'Game,Quota,Player,Weight,Value\n';
    results.forEach(game => {
      game.weights.forEach((weight, playerIndex) => {
        csv += `${game.gameIndex},${game.quota},${playerIndex + 1},${weight},${game.values[playerIndex].toFixed(6)}\n`;
      });
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${method}_values.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="voting-calculator">
      <div className="container">
        <div className="controls">
          <div className="control-group">
            <label htmlFor="k">Number of Games (k):</label>
            <input
              id="k"
              type="number"
              min="1"
              max="20"
              value={k}
              onChange={(e) => handleKChange(parseInt(e.target.value) || 1)}
              className="number-input"
            />
          </div>

          <div className="control-group">
            <label htmlFor="method">Calculation Method:</label>
            <select
              id="method"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="select-input"
            >
              <option value="shapley">Shapley Values</option>
              <option value="banzhaf">Banzhaf Values</option>
            </select>
          </div>

          <div className="csv-upload">
            <label htmlFor="csv-file" className="upload-label">
              <Upload className="icon" />
              Upload CSV
            </label>
            <input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="file-input"
            />
          </div>
        </div>

        {error && (
          <div className="error-message">
            <Info className="icon" />
            {error}
          </div>
        )}

        <div className="games-container">
          {Array.from({ length: k }, (_, gameIndex) => (
            <div key={gameIndex} className="game-card">
              <h3>Game {gameIndex + 1}</h3>
              
              <div className="quota-input">
                <label>Quota:</label>
                <input
                  type="number"
                  min="0"
                  value={quotas[gameIndex]}
                  onChange={(e) => handleQuotaChange(gameIndex, e.target.value)}
                  className="number-input"
                />
              </div>

              <div className="weights-section">
                <h4>Player Weights:</h4>
                <div className="weights-grid">
                  {weights[gameIndex].map((weight, playerIndex) => (
                    <div key={playerIndex} className="weight-input">
                      <label>Player {playerIndex + 1}:</label>
                      <input
                        type="number"
                        min="0"
                        value={weight}
                        onChange={(e) => handleWeightChange(gameIndex, playerIndex, e.target.value)}
                        className="number-input"
                      />
                      {weights[gameIndex].length > 1 && (
                        <button
                          onClick={() => removePlayer(gameIndex, playerIndex)}
                          className="remove-btn"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => addPlayer(gameIndex)}
                  className="add-player-btn"
                >
                  + Add Player
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="calculate-section">
          <button
            onClick={calculateResults}
            disabled={loading}
            className="calculate-btn"
          >
            {loading ? 'Calculating...' : `Calculate ${method === 'shapley' ? 'Shapley' : 'Banzhaf'} Values`}
          </button>
        </div>

        {results && (
          <div className="results-section">
            <div className="results-header">
              <h2>Results</h2>
              <button onClick={exportResults} className="export-btn">
                <Download className="icon" />
                Export CSV
              </button>
            </div>
            
            {results.map((game, gameIndex) => (
              <div key={gameIndex} className="result-card">
                <h3>Game {game.gameIndex}</h3>
                <p><strong>Quota:</strong> {game.quota}</p>
                <p><strong>Total Weight:</strong> {game.totalWeight}</p>
                
                <div className="values-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Player</th>
                        <th>Weight</th>
                        <th>{method === 'shapley' ? 'Shapley' : 'Banzhaf'} Value</th>
                        <th>Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {game.values.map((value, playerIndex) => (
                        <tr key={playerIndex}>
                          <td>Player {playerIndex + 1}</td>
                          <td>{game.weights[playerIndex]}</td>
                          <td>{value.toFixed(6)}</td>
                          <td>{(value * 100).toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="info-section">
          <h3>About</h3>
          <p>
            This calculator computes Shapley and Banzhaf values for weighted voting games.
            Input format: k (number of games), followed by k quotas and k weight vectors.
          </p>
          <p>
            <strong>CSV Format:</strong> First line: k, Next k lines: quotas, Remaining k lines: comma-separated weights
          </p>
        </div>
      </div>
    </div>
  );
};

export default VotingGameCalculator;