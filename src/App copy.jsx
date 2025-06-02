/* eslint-disable no-unused-vars */
import { useState } from 'react';
import { Plus, Minus, Info } from 'lucide-react';

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
      <div className="mt-4">
        <h3 className="font-semibold mb-2">Axis Visualization:</h3>
        <div className="flex items-center justify-center bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            {axis.map((candidate, index) => (
              <div key={candidate} className="flex items-center">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-semibold">
                  {candidate}
                </div>
                {index < axis.length - 1 && (
                  <div className="w-8 h-0.5 bg-blue-300 mx-1"></div>
                )}
              </div>
            ))}
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2 text-center">
          Single-peaked axis: {axis.join(' → ')}
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Single-Peaked Preference Checker
        </h1>
        
        <div className="flex gap-6">
          {/* Main Interface */}
          <div className="flex-1 bg-white rounded-lg shadow-md p-6">
            {/* Candidates Management */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Candidates</h2>
              <div className="flex flex-wrap gap-2 mb-3">
                {candidates.map((candidate, index) => (
                  <div key={candidate} className="flex items-center bg-gray-100 rounded px-3 py-1">
                    <span className="font-medium">{candidate}</span>
                    {candidates.length > 2 && (
                      <button
                        onClick={() => removeCandidate(index)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        <Minus size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={addCandidate}
                className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 flex items-center gap-1"
              >
                <Plus size={16} /> Add Candidate
              </button>
            </div>

            {/* Voters Management */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Voters</h2>
              {voters.map((voter, voterIndex) => (
                <div key={voter.id} className="mb-3 p-3 bg-gray-50 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Voter {voterIndex + 1}</span>
                    {voters.length > 1 && (
                      <button
                        onClick={() => removeVoter(voter.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Minus size={16} />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {voter.preferences.map((candidate, prefIndex) => (
                      <div key={prefIndex} className="flex items-center">
                        <select
                          value={candidate}
                          onChange={(e) => updateVoterPreference(voter.id, prefIndex, e.target.value)}
                          className="border rounded px-2 py-1"
                        >
                          {candidates.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        {prefIndex < voter.preferences.length - 1 && (
                          <span className="mx-2 text-gray-500">→</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button
                onClick={addVoter}
                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 flex items-center gap-1"
              >
                <Plus size={16} /> Add Voter
              </button>
            </div>

            {/* Check Button */}
            <div className="mb-6">
              <button
                onClick={handleCheck}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 font-semibold text-lg"
              >
                Check Single-Peakedness
              </button>
            </div>

            {/* Output */}
            {output && (
              <div className="p-4 border rounded-lg bg-gray-100">
                <h3 className="font-semibold mb-2">Result:</h3>
                {output === "No" ? (
                  <p className="text-red-600 font-medium">The preference profile is NOT single-peaked.</p>
                ) : (
                  <div>
                    <p className="text-green-600 font-medium">The preference profile IS single-peaked!</p>
                    <AxisVisualization axis={output} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Documentation */}
          <div className="w-80 bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Algorithm Documentation</h2>
              <button
                onClick={() => setShowDocs(!showDocs)}
                className="text-blue-500 hover:text-blue-700"
              >
                <Info size={20} />
              </button>
            </div>
            
            <div className={`${showDocs ? 'block' : 'hidden'} space-y-4 text-sm`}>
              <div>
                <h3 className="font-semibold mb-2">What is Single-Peakedness?</h3>
                <p>A preference profile is single-peaked if there exists an ordering (axis) of candidates such that each voter's preferences have a single peak - they prefer candidates closer to their peak over those further away.</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Algorithm Overview</h3>
                <p>The algorithm works in two main stages:</p>
                <ol className="list-decimal list-inside space-y-1 mt-2">
                  <li><strong>First Stage:</strong> Identify candidates that can be placed at the extremes of the axis by finding those ranked last by some voters.</li>
                  <li><strong>Second Stage:</strong> For remaining candidates, determine their position relative to the current left and right extremes.</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Key Concepts</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Bottom-ranked:</strong> Candidates ranked last by at least one voter among a given set</li>
                  <li><strong>Restricted preferences:</strong> A voter's preferences limited to a subset of candidates</li>
                  <li><strong>Left/Right placement:</strong> Determining which side of the axis a candidate belongs to</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Example</h3>
                <p>Consider preferences A → B → C and C → B → A. This is single-peaked with axis A → B → C, where the first voter peaks at A and the second at C.</p>
              </div>
            </div>

            <div className={`${!showDocs ? 'block' : 'hidden'} text-sm text-gray-600`}>
              <p>Click the info icon to view detailed algorithm documentation.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;