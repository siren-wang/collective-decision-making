/* eslint-disable no-unused-vars */
import { useState } from 'react';
import './App.css';

function App() {
  const [voters, setVoters] = useState([{ id: 1, preferences: ['A', 'B', 'C'] }]);
  const [candidates, setCandidates] = useState(['A', 'B', 'C']);
  const [output, setOutput] = useState(null);
  const [showDocs, setShowDocs] = useState(false);

  function getBottomRanked(profile, A_prime) {
    const bottom_set = new Set();
    for (const voter of profile) {
      for (let i = voter.length - 1; i >= 0; i--) {
        const candidate = voter[i];
        if (A_prime.has(candidate)) {
          bottom_set.add(candidate);
          break;
        }
      }
    }
    return Array.from(bottom_set);
  }

  function restricted(voter, A_prime) {
    return voter.filter((c) => A_prime.has(c));
  }

  function recognizeSinglePeaked(profile) {
    if (profile.length === 0) return "No";
    const A = profile[0];
    let A_prime = new Set(A);
    const left = [];
    const right = [];

    // First stage
    while (A_prime.size > 0 && right.length === 0) {
      const B = getBottomRanked(profile, A_prime);
      if (B.length > 2) return "No";
      if (B.length === 1) left.push(B[0]);
      else {
        left.push(B[0]);
        right.unshift(B[1]);
      }
      B.forEach((x) => A_prime.delete(x));
    }

    // Second stage
    while (A_prime.size >= 2) {
      const l = left[left.length - 1];
      const r = right[0];
      const B = getBottomRanked(profile, A_prime);
      if (B.length > 2) return "No";

      const L = new Set();
      const R = new Set();

      for (const x of B) {
        for (const voter of profile) {
          const Pi = restricted(voter, A_prime);
          if (Pi.includes(l) && Pi.includes(r) && Pi.includes(x)) {
            const lx = Pi.indexOf(x), ll = Pi.indexOf(l), lr = Pi.indexOf(r);
            if (lr < lx && lx < ll) L.add(x);
            else if (ll < lx && lx < lr) R.add(x);
          }
        }
      }

      if (L.size > 1 || R.size > 1) return "No";
      if ([...L].some((x) => R.has(x))) return "No";

      const undecided = B.filter((x) => !L.has(x) && !R.has(x));
      for (const x of undecided) {
        if (L.size === 0) L.add(x);
        else if (R.size === 0) R.add(x);
        else return "No";
      }

      left.push(...L);
      right.unshift(...R);
      B.forEach((x) => A_prime.delete(x));
    }

    return [...left, ...A_prime, ...right];
  }

  const addCandidate = () => {
    const newCandidate = String.fromCharCode(65 + candidates.length);
    setCandidates([...candidates, newCandidate]);
    setVoters(voters.map(voter => ({
      ...voter,
      preferences: [...voter.preferences, newCandidate]
    })));
  };

  const removeCandidate = (index) => {
    if (candidates.length <= 2) return;
    const candidateToRemove = candidates[index];
    setCandidates(candidates.filter((_, i) => i !== index));
    setVoters(voters.map(voter => ({
      ...voter,
      preferences: voter.preferences.filter(c => c !== candidateToRemove)
    })));
  };

  const addVoter = () => {
    const newId = Math.max(...voters.map(v => v.id)) + 1;
    setVoters([...voters, { id: newId, preferences: [...candidates] }]);
  };

  const removeVoter = (id) => {
    if (voters.length <= 1) return;
    setVoters(voters.filter(voter => voter.id !== id));
  };

  const updateVoterPreference = (voterId, candidateIndex, newCandidate) => {
    setVoters(voters.map(voter => {
      if (voter.id === voterId) {
        const newPrefs = [...voter.preferences];
        newPrefs[candidateIndex] = newCandidate;
        return { ...voter, preferences: newPrefs };
      }
      return voter;
    }));
  };

  const handleCheck = () => {
    try {
      const profile = voters.map(voter => voter.preferences);
      const result = recognizeSinglePeaked(profile);
      setOutput(result);
    } catch (e) {
      setOutput("Invalid input");
    }
  };

  const AxisVisualization = ({ axis }) => {
    if (!Array.isArray(axis)) return null;
    
    return (
      <div className="axis-visualization">
        <h3 className="axis-title">Axis Visualization:</h3>
        <div className="axis-container">
          <div className="axis-nodes">
            {axis.map((candidate, index) => (
              <div key={candidate}>
                <div className="axis-node">
                  {candidate}
                </div>
                {index < axis.length - 1 && (
                  <div className="axis-line"></div>
                )}
              </div>
            ))}
          </div>
        </div>
        <p className="axis-description">
          Single-peaked axis: {axis.join(' → ')}
        </p>
      </div>
    );
  };

  const Documentation = () => (
    <div className="docs-panel">
      <div className="docs-header">
        <h2 className="docs-title">Algorithm Documentation</h2>
        <button
          className="info-btn"
          onClick={() => setShowDocs(!showDocs)}
          title={showDocs ? "Hide documentation" : "Show documentation"}
        >
          ℹ
        </button>
      </div>
      
      {showDocs ? (
        <div className="docs-content">
          <div>
            <h3>What is Single-Peakedness?</h3>
            <p>A preference profile is single-peaked if there exists an ordering (axis) of candidates such that each voter's preferences have a single peak - they prefer candidates closer to their peak over those further away.</p>
          </div>

          <div>
            <h3>Algorithm Overview</h3>
            <p>The algorithm works in two main stages:</p>
            <ol>
              <li><strong>First Stage:</strong> Identify candidates that can be placed at the extremes of the axis by finding those ranked last by some voters.</li>
              <li><strong>Second Stage:</strong> For remaining candidates, determine their position relative to the current left and right extremes.</li>
            </ol>
          </div>

          <div>
            <h3>Key Concepts</h3>
            <ul>
              <li><strong>Bottom-ranked:</strong> Candidates ranked last by at least one voter among a given set</li>
              <li><strong>Restricted preferences:</strong> A voter's preferences limited to a subset of candidates</li>
              <li><strong>Left/Right placement:</strong> Determining which side of the axis a candidate belongs to</li>
            </ul>
          </div>

          <div>
            <h3>Example</h3>
            <p>Consider preferences A → B → C and C → B → A. This is single-peaked with axis A → B → C, where the first voter peaks at A and the second at C.</p>
          </div>

          <div>
            <h3>Implementation Details</h3>
            <p>The algorithm incrementally builds the axis by:</p>
            <ul>
              <li>Finding candidates that can only be at extremes</li>
              <li>Using voter preference structure to determine relative positions</li>
              <li>Ensuring consistency across all voter preferences</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="docs-collapsed">
          Click the info icon to view detailed algorithm documentation.
        </div>
      )}
    </div>
  );

  return (
    <div className="container">
      <h1 className="main-title">Single-Peaked Preference Checker</h1>
      
      <div className="layout">
        {/* Main Interface */}
        <div className="main-panel">
          {/* Candidates Management */}
          <div className="section">
            <h2 className="section-title">Candidates</h2>
            <div className="candidates-list">
              {candidates.map((candidate, index) => (
                <div key={candidate} className="candidate-tag">
                  <span>{candidate}</span>
                  {candidates.length > 2 && (
                    <button
                      className="remove-btn"
                      onClick={() => removeCandidate(index)}
                      title={`Remove candidate ${candidate}`}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button className="add-btn" onClick={addCandidate}>
              + Add Candidate
            </button>
          </div>

          {/* Voters Management */}
          <div className="section">
            <h2 className="section-title">Voters</h2>
            {voters.map((voter, voterIndex) => (
              <div key={voter.id} className="voter-card">
                <div className="voter-header">
                  <span className="voter-label">Voter {voterIndex + 1}</span>
                  {voters.length > 1 && (
                    <button
                      className="remove-btn"
                      onClick={() => removeVoter(voter.id)}
                      title={`Remove voter ${voterIndex + 1}`}
                    >
                      ×
                    </button>
                  )}
                </div>
                <div className="preferences-row">
                  {voter.preferences.map((candidate, prefIndex) => (
                    <div key={prefIndex}>
                      <select
                        className="preference-select"
                        value={candidate}
                        onChange={(e) => updateVoterPreference(voter.id, prefIndex, e.target.value)}
                      >
                        {candidates.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      {prefIndex < voter.preferences.length - 1 && (
                        <span className="arrow">→</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button className="add-btn" onClick={addVoter}>
              + Add Voter
            </button>
          </div>

          {/* Check Button */}
          <div className="section">
            <button className="check-btn" onClick={handleCheck}>
              Check Single-Peakedness
            </button>
          </div>

          {/* Output */}
          {output && (
            <div className="result-panel">
              <h3 className="result-title">Result:</h3>
              {output === "No" || output === "Invalid input" ? (
                <p className="result-failure">The preference profile is NOT single-peaked.</p>
              ) : (
                <div>
                  <p className="result-success">The preference profile IS single-peaked!</p>
                  <AxisVisualization axis={output} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Documentation */}
        <Documentation />
      </div>
    </div>
  );
}

export default App;