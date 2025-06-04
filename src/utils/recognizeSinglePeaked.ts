type Alternative = string | number;
type Profile = Alternative[][];

export interface SinglePeakedResult {
  isSinglePeaked: boolean;
  ordering?: Alternative[];
}

/**
 * Verifies whether a list of preferences is single-peaked with respect to an axis
 */
export function verifySinglePeaked(axis: Alternative[], preferences: Alternative[][]): boolean {
  let isSP = true;
  let i = 0;
  
  while (i < preferences.length && isSP) {
    const preference = preferences[i];
    const indexFirstCandidate = axis.indexOf(preference[0]);
    let pointerLeft = indexFirstCandidate;
    let pointerRight = indexFirstCandidate;
    
    let j = 1;
    while (j < preference.length && isSP) {
      const indexCandidate = axis.indexOf(preference[j]);
      if (indexCandidate < pointerLeft) {
        pointerLeft = indexCandidate;
      } else if (indexCandidate > pointerRight) {
        pointerRight = indexCandidate;
      } else {
        isSP = false;
      }
      j++;
    }
    i++;
  }
  
  return isSP;
}

/**
 * Recognizes whether a profile is single-peaked and finds a compatible axis if it exists
 * 
 * Based on the algorithm from "Single-peaked consistency and its complexity" 
 * by Bruno Escoffier, Jérôme Lang and Meltem Oztürk (2008)
 */
export function recognizeSinglePeaked(profile: Profile): SinglePeakedResult {
  let isSP = true;
  let endFlag = false;
  let axis: Alternative[] | null = null;
  const rightAxis: Alternative[] = [];
  const leftAxis: Alternative[] = [];
  let xi: Alternative | null = null;
  let xj: Alternative | null = null;
  
  // Create deep copy of preferences for modification
  const preferencesSpCopy: Alternative[][] = profile.map(pref => [...pref]);
  
  let iteration = 0;
  while (isSP && preferencesSpCopy.length > 0 && preferencesSpCopy[0].length >= 1 && !endFlag) {
    // Make a list of last candidates
    const lastCandidates: Alternative[] = [];
    for (const preference of preferencesSpCopy) {
      const lastCandidate = preference.pop();
      if (lastCandidate !== undefined && !lastCandidates.includes(lastCandidate)) {
        lastCandidates.push(lastCandidate);
      }
    }
    
    if (lastCandidates.length >= 3) {
      // Impossible to position all candidates in leftmost and rightmost axis
      isSP = false;
      endFlag = true;
    } else if (lastCandidates.length === 1) {
      const x = lastCandidates[0];
      
      // Remove x from all preferences where it appears
      for (const preference of preferencesSpCopy) {
        const index = preference.indexOf(x);
        if (index !== -1) {
          preference.splice(index, 1);
        }
      }
      
      let case_ = 0;
      
      for (let i = 0; i < profile.length; i++) {
        // Find index of x, xi, xj in each preference
        const indexX = profile[i].indexOf(x);
        const indexXi = xi === null ? -1 : profile[i].indexOf(xi);
        const indexXj = xj === null ? -1 : profile[i].indexOf(xj);
        
        // 3 possibilities for len(lastCandidates) == 1
        if (indexXi > indexX && indexX > indexXj) { // Case 1
          const caseI = 1;
          if (case_ === 0) {
            case_ = caseI;
          } else if (case_ === 1) {
            // pass
          } else if (case_ === 2) {
            endFlag = true;
            isSP = false; // contradiction
            break;
          }
        } else if (indexXj > indexX && indexX > indexXi) { // Case 2
          const caseI = 2;
          if (case_ === 0) {
            case_ = caseI;
          } else if (case_ === 2) {
            // pass
          } else if (case_ === 1) {
            endFlag = true;
            isSP = false; // contradiction
            break;
          }
        } else if (indexX > indexXi && indexX > indexXj) { // Case 0
          const caseI = 0;
        }
      }
      
      // Add x in leftmost or rightmost axis according to case if axis is compatible
      if (!endFlag) {
        if (case_ === 0) {
          leftAxis.push(x);
          xi = x;
        } else if (case_ === 1) {
          leftAxis.push(x);
          xi = x;
        } else if (case_ === 2) {
          rightAxis.unshift(x);
          xj = x;
        }
      }
    } else if (lastCandidates.length === 2) {
      let x = lastCandidates[0];
      let y = lastCandidates[1];
      
      // Remove x and y from all preferences where they appear
      for (const preference of preferencesSpCopy) {
        let index = preference.indexOf(x);
        if (index !== -1) {
          preference.splice(index, 1);
        }
        index = preference.indexOf(y);
        if (index !== -1) {
          preference.splice(index, 1);
        }
      }
      
      let case_ = 0;
      
      for (let i = 0; i < profile.length; i++) {
        // Find index of x, y, xi, xj in each preference
        let indexX = profile[i].indexOf(x);
        let indexY = profile[i].indexOf(y);
        
        const indexXi = xi === null ? -1 : profile[i].indexOf(xi);
        const indexXj = xj === null ? -1 : profile[i].indexOf(xj);
        
        // Swap position to put x in the lower position (ranked last)
        if (indexY > indexX) {
          [indexX, indexY] = [indexY, indexX];
          // Note: Don't swap x and y here - this was the bug!
        }
        
        // All possible cases
        if ((indexXi > indexX && indexX > indexY && indexY > indexXj) ||
            (indexXj > indexX && indexX > indexY && indexY > indexXi)) { // Case 4
          
          // Get index for leftover elements and append them into left axis following increasing order
          const tBar = [...lastCandidates, ...preferencesSpCopy[i]];
          const order: [number, Alternative][] = [];
          for (const candidate of tBar) {
            const indexCandidate = profile[i].indexOf(candidate);
            order.push([indexCandidate, candidate]);
          }
          order.sort((a, b) => b[0] - a[0]); // reverse sort
          for (const [, candidate] of order) {
            leftAxis.push(candidate);
          }
          
          axis = [...leftAxis, ...rightAxis];
          isSP = verifySinglePeaked(axis, profile);
          endFlag = true;
          break;
        } else if (indexXi !== -1 && indexXj !== -1 && indexXi > indexX && indexX > indexXj && indexXj > indexY) { // Case 1
          const caseI = 1;
          if (case_ === 0) {
            case_ = caseI;
          } else if (case_ === 1) {
            // pass
          } else if (case_ === 2) {
            endFlag = true;
            isSP = false; // contradiction
            break;
          }
        } else if (indexXi !== -1 && indexXj !== -1 && indexXj > indexX && indexX > indexXi && indexXi > indexY) { // Case 2
          const caseI = 2;
          if (case_ === 0) {
            case_ = caseI;
          } else if (case_ === 2) {
            // pass
          } else if (case_ === 1) {
            endFlag = true;
            isSP = false; // contradiction
            break;
          }
        } else if ((indexXi === -1 || indexX > indexXi) && (indexXj === -1 || indexX > indexXj)) {
          // Case 0 - both xi and xj are either null or have positions after x
        }
      }
      
      // Add x and y in leftmost or rightmost axis according to case if axis is compatible
      if (!endFlag) {
        if (case_ === 0) {
          leftAxis.push(x);
          rightAxis.unshift(y);
          xi = x;
          xj = y;
        } else if (case_ === 1) {
          leftAxis.push(x);
          rightAxis.unshift(y);
          xi = x;
          xj = y;
        } else if (case_ === 2) {
          leftAxis.push(y);
          rightAxis.unshift(x);
          xi = y;
          xj = x;
        }
      }
    }
    
    iteration++;
  }
  
  if (isSP && axis === null) {
    axis = [...leftAxis, ...rightAxis];
  }
  
  return {
    isSinglePeaked: isSP,
    ordering: isSP ? axis || undefined : undefined
  };
}