let processes = [];
let resources = [];
let allocation = [];
let maxResources = [];
let need = [];
let available = [];
let safeSequence = [];

function addProcess() {
    const processId = `P${processes.length + 1}`;
    processes.push(processId);

    allocation.push(new Array(resources.length).fill(0));
    maxResources.push(new Array(resources.length).fill(0));
    need.push(new Array(resources.length).fill(0));

    updateAllocationTable();
    updateSystemState();
    updateGraph();
}

function addResource() {
    const resourceId = `R${resources.length + 1}`;
    resources.push(resourceId);
    available.push(0);

    allocation.forEach(row => row.push(0));
    maxResources.forEach(row => row.push(0));
    need.forEach(row => row.push(0));

    updateAllocationTable();
    updateAvailableResources();
    updateSystemState();
    updateGraph();
}

function updateAllocationTable() {
    const tableBody = document.getElementById('allocationBody');
    tableBody.innerHTML = '';

    processes.forEach((process, i) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${process}</td>
            <td>${allocation[i].map((res, j) => `<input type="number" value="${res}" onchange="updateAllocation(${i}, ${j}, this.value)">`).join('')}</td>
            <td>${maxResources[i].map((res, j) => `<input type="number" value="${res}" onchange="updateMax(${i}, ${j}, this.value)">`).join('')}</td>
            <td>${need[i].map(res => `<span>${res}</span>`).join(', ')}</td>
        `;
        tableBody.appendChild(row);
    });
}

function updateAllocation(i, j, value) {
    allocation[i][j] = parseInt(value) || 0;
    updateNeed();
    updateSystemState();
    updateGraph();
}

function updateMax(i, j, value) {
    maxResources[i][j] = parseInt(value) || 0;
    updateNeed();
    updateSystemState();
    updateGraph();
}

function updateNeed() {
    for (let i = 0; i < processes.length; i++) {
        for (let j = 0; j < resources.length; j++) {
            need[i][j] = maxResources[i][j] - allocation[i][j];
        }
    }
    updateAllocationTable();
}


function updateAvailableResources() {
    const availableResourcesDiv = document.getElementById('availableResources');
    availableResourcesDiv.innerHTML = resources.map((resource, index) => `
        <div>
            ${resource}: <input type="number" value="${available[index]}" onchange="updateAvailable(${index}, this.value)">
        </div>
    `).join('');
}

function updateAvailable(index, value) {
    available[index] = parseInt(value) || 0;
    updateSystemState();
    updateGraph();
}

function simulate() {
    const resultElement = document.getElementById('result');
    const isSafeState = isSafe();
    if (isSafeState) {
        resultElement.textContent = `The system is in a safe state.\nSafe sequence: ${safeSequence.join(' -> ')}`;
    } else {
        resultElement.textContent = 'The system is in an unsafe state, and deadlock may occur.';
    }
    updateGraph(!isSafeState);
}

function isSafe() {
    const work = [...available];
    const finish = new Array(processes.length).fill(false);
    safeSequence = [];

    let count = 0;
    while (count < processes.length) {
        let found = false;
        for (let i = 0; i < processes.length; i++) {
            if (!finish[i] && need[i].every((n, j) => n <= work[j])) {
                for (let j = 0; j < resources.length; j++) {
                    work[j] += allocation[i][j];
                }
                finish[i] = true;
                safeSequence.push(processes[i]);
                found = true;
                count++;
                break;
            }
        }
        if (!found) break;
    }

    return count === processes.length;
}

function updateSystemState() {
    const stateElement = document.getElementById('systemState');
    stateElement.innerHTML = '';

    const availableBox = document.createElement('div');
    availableBox.className = 'state-box';
    availableBox.innerHTML = `<h3>Available</h3>${available.join(', ')}`;
    stateElement.appendChild(availableBox);

    processes.forEach((process, i) => {
        const processBox = document.createElement('div');
        processBox.className = 'state-box';
        processBox.innerHTML = `
            <h3>${process}</h3>
            Allocated: ${allocation[i].join(', ')}<br>
            Max: ${maxResources[i].join(', ')}<br>
            Need: ${need[i].join(', ')}
        `;
        stateElement.appendChild(processBox);
    });
}

function updateGraph(isDeadlock = false) {
    const graphElement = document.getElementById('graph');
    graphElement.innerHTML = '';
  
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "300");
  
    const processRadius = 20; 
    const resourceRadius = 15; 
    const horizontalSpacing = 150;
    const verticalSpacing = 80;
  
    // Draw processes
    processes.forEach((process, i) => {
      const circle = document.createElementNS(svgNS, "circle");
      circle.setAttribute("cx", 50);
      circle.setAttribute("cy", (i + 1) * verticalSpacing);
      circle.setAttribute("r", processRadius);
      circle.setAttribute("fill", isDeadlock ? "#FF5722" : "#2196F3");
  
      const text = document.createElementNS(svgNS, "text");
      text.setAttribute("x", 50);
      text.setAttribute("y", (i + 1) * verticalSpacing + 5);
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("fill", "white");
      text.textContent = process;
  
      svg.appendChild(circle);
      svg.appendChild(text);
    });
  
    // Draw resources
    resources.forEach((resource, i) => {
      const circle = document.createElementNS(svgNS, "circle");
      circle.setAttribute("cx", 250);
      circle.setAttribute("cy", (i + 1) * verticalSpacing);
      circle.setAttribute("r", resourceRadius);
      circle.setAttribute("fill", "#FF5722");
  
      const text = document.createElementNS(svgNS, "text");
      text.setAttribute("x", 250);
      text.setAttribute("y", (i + 1) * verticalSpacing + 5);
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("fill", "white");
      text.textContent = resource;
  
      svg.appendChild(circle);
      svg.appendChild(text);
    });
  
    // Draw allocation edges
    processes.forEach((process, i) => {
      resources.forEach((resource, j) => {
        if (allocation[i][j] > 0) {
          const line = document.createElementNS(svgNS, "line");
          line.setAttribute("x1", 50 + processRadius);
          line.setAttribute("y1", (i + 1) * verticalSpacing);
          line.setAttribute("x2", 250 - resourceRadius);
          line.setAttribute("y2", (j + 1) * verticalSpacing);
          line.setAttribute("stroke", "#2196F3");
          line.setAttribute("stroke-width", "2");
          svg.appendChild(line);
        }
      });
    });
  
    // Draw request edges
    processes.forEach((process, i) => {
      resources.forEach((resource, j) => {
        if (need[i][j] > 0) {
          const line = document.createElementNS(svgNS, "line");
          line.setAttribute("x1", 50 + processRadius);
          line.setAttribute("y1", (i + 1) * verticalSpacing);
          line.setAttribute("x2", 250 - resourceRadius);
          line.setAttribute("y2", (j + 1) * verticalSpacing);
          line.setAttribute("stroke", isDeadlock ? "#FF0000" : "#FF5722");
          line.setAttribute("stroke-width", "2");
          line.setAttribute("stroke-dasharray", isDeadlock ? "5,5" : "");
          svg.appendChild(line);
        }
      });
    });
  
    graphElement.appendChild(svg);
  }
  
  
  

function reset() {
    processes = [];
    resources = [];
    allocation = [];
    maxResources = [];
    need = [];
    available = [];
    safeSequence = [];

    updateAllocationTable();
    updateAvailableResources();
    updateSystemState();
    updateGraph();
    document.getElementById('result').textContent = '';
}

// Initialize the simulator
addProcess();
addResource();
updateAvailableResources();
updateSystemState();
updateGraph();