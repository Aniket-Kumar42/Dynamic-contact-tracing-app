// Utility: show notification
function showNotification(msg, color = 'bg-green-600') {
  const notif = document.getElementById('notification');
  notif.textContent = msg;
  notif.className = `fixed bottom-4 right-4 text-white px-4 py-2 rounded shadow-lg ${color}`;
  notif.classList.remove('hidden');
  setTimeout(() => notif.classList.add('hidden'), 3000);
}

// Get userId from localStorage
const userId = localStorage.getItem('userId');
if (!userId) window.location.href = 'index.html';

const profileInfo = document.getElementById('profile-info');
const infectionStatus = document.getElementById('infection-status');
const infectionToggleBtn = document.getElementById('infection-toggle-btn');
const infectionToggleContainer = document.getElementById('infection-toggle-container');
const toggleSlider = document.getElementById('toggle-slider');
const refreshBtn = document.getElementById('refresh-btn');
const addContactForm = document.getElementById('add-contact-form');
const contactIdsInput = document.getElementById('contact-ids');
const removeContactForm = document.getElementById('remove-contact-form');
const removeContactIdsInput = document.getElementById('remove-contact-ids');
const logoutBtn = document.getElementById('logout-btn');
const messagesContent = document.getElementById('messages-content');

// Toggle infection status
let isInfected = false;

function updateToggleUI() {
  if (isInfected) {
    infectionToggleContainer.className = 'flex-1 bg-red-500 rounded-lg px-4 py-3 transition-colors duration-300';
    toggleSlider.style.transform = 'translateX(24px)';
    infectionToggleBtn.className = 'ml-3 bg-red-600 w-12 h-6 rounded-full relative transition-colors duration-300';
  } else {
    infectionToggleContainer.className = 'flex-1 bg-green-500 rounded-lg px-4 py-3 transition-colors duration-300';
    toggleSlider.style.transform = 'translateX(0)';
    infectionToggleBtn.className = 'ml-3 bg-gray-300 w-12 h-6 rounded-full relative transition-colors duration-300';
  }
}

// Load messages for the user
async function loadMessages() {
  const res = await fetch('http://127.0.0.1:5000/getMessages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: userId })
  });
  const data = await res.json();
  if (data.status === 'ok') {
    if (data.messages && data.messages.length > 0) {
      messagesContent.innerHTML = data.messages.map(msg => 
        `<div class="mb-3 p-3 bg-white rounded border-l-4 border-red-500 shadow-sm">
          <p class="text-sm text-gray-800">${msg}</p>
        </div>`
      ).join('');
    } else {
      messagesContent.innerHTML = '<p class="text-gray-500 italic">No message received</p>';
    }
  } else {
    messagesContent.innerHTML = '<p class="text-red-500">Failed to load messages</p>';
  }
}

// Fetch and display profile, status, risk
async function loadProfile() {
  // Get exposure graph for user info
  const res = await fetch('http://127.0.0.1:5000/getExposureGraph', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: userId })
  });
  const data = await res.json();
  if (data.status !== 'ok') {
    showNotification('Failed to load profile', 'bg-red-600');
    return;
  }
  const me = data.graph[userId];
  profileInfo.innerHTML = `
    <div><b>ID:</b> ${userId}</div>
    <div><b>Name:</b> ${me.name || ''}</div>
    <div><b>Contacts:</b> ${(me.contacts || []).join(', ') || 'None'}</div>
  `;
  infectionStatus.textContent = me.status;
  infectionStatus.className = `ml-2 px-2 py-1 rounded ${me.status === 'infected' ? 'bg-red-500 text-white' : me.status === 'exposed' ? 'bg-yellow-400 text-black' : 'bg-green-500 text-white'}`;
  
  // Update toggle state based on infection status
  isInfected = me.status === 'infected';
  updateToggleUI();
  
  // Load messages
  await loadMessages();
  
  // Draw graph
  drawGraph(data.graph);
}

// Toggle infection status
infectionToggleBtn.onclick = async () => {
  if (!isInfected) {
    // Mark as infected
    const res = await fetch('http://127.0.0.1:5000/markInfected', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userId })
    });
    const data = await res.json();
    if (data.status === 'ok') {
      // Send automatic infection alert to contacts
      const alertRes = await fetch('http://127.0.0.1:5000/sendInfectionAlert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId })
      });
      const alertData = await alertRes.json();
      
      isInfected = true;
      updateToggleUI();
      showNotification('Marked as infected! Automatic alerts sent to contacts.', 'bg-red-600');
      loadProfile();
    } else {
      showNotification('Failed to mark infected', 'bg-red-600');
    }
  } else {
    // Unmark as infected
    const res = await fetch('http://127.0.0.1:5000/unmarkInfected', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userId })
    });
    const data = await res.json();
    if (data.status === 'ok') {
      isInfected = false;
      updateToggleUI();
      showNotification('Unmarked as infected! Status reverted to healthy.', 'bg-green-600');
      loadProfile();
    } else {
      showNotification('Failed to unmark infected', 'bg-red-600');
    }
  }
};

// Refresh
refreshBtn.onclick = loadProfile;

// Add contacts
addContactForm.onsubmit = async (e) => {
  e.preventDefault();
  const ids = contactIdsInput.value.split(',').map(s => s.trim()).filter(Boolean);
  if (!ids.length) return;
  const res = await fetch('http://127.0.0.1:5000/addContact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: userId, contacts: ids })
  });
  const data = await res.json();
  if (data.status === 'ok') {
    showNotification('Contacts added!');
    contactIdsInput.value = '';
    loadProfile();
  } else {
    showNotification('Failed to add contacts', 'bg-red-600');
  }
};

// Remove contacts
removeContactForm.onsubmit = async (e) => {
  e.preventDefault();
  const ids = removeContactIdsInput.value.split(',').map(s => s.trim()).filter(Boolean);
  if (!ids.length) return;
  const res = await fetch('http://127.0.0.1:5000/removeContact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: userId, contacts: ids })
  });
  const data = await res.json();
  if (data.status === 'ok') {
    showNotification('Contacts removed!');
    removeContactIdsInput.value = '';
    loadProfile();
  } else {
    showNotification('Failed to remove contacts', 'bg-red-600');
  }
};

// Logout
logoutBtn.onclick = () => {
  localStorage.removeItem('userId');
  window.location.href = 'index.html';
};

// Draw exposure graph with Cytoscape.js
function drawGraph(graph) {
  const cy = cytoscape({
    container: document.getElementById('cy'),
    elements: [],
    style: [
      { selector: 'node', style: {
        'label': 'data(label)',
        'background-color': 'data(color)',
        'text-valign': 'center',
        'color': '#222',
        'font-weight': 'bold',
        'border-width': 2,
        'border-color': '#888'
      }},
      { selector: 'edge', style: {
        'width': 2,
        'line-color': '#bbb',
        'target-arrow-color': '#bbb',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier'
      }}
    ],
    layout: { name: 'cose', animate: true }
  });
  
  // Add nodes
  Object.entries(graph).forEach(([id, node]) => {
    cy.add({
      group: 'nodes',
      data: {
        id,
        label: node.name ? `${id}: ${node.name}` : id,
        color: node.status === 'infected' ? '#f87171' : node.status === 'exposed' ? '#facc15' : '#4ade80'
      }
    });
  });
  
  // Add edges (prevent duplicates)
  const addedEdges = new Set();
  Object.entries(graph).forEach(([id, node]) => {
    (node.contacts || []).forEach(cid => {
      if (graph[cid]) {
        // Create a unique edge ID (sorted to ensure consistency)
        const edgeId = [id, cid].sort().join('-');
        if (!addedEdges.has(edgeId)) {
          cy.add({ 
            group: 'edges', 
            data: { 
              id: edgeId, 
              source: id, 
              target: cid 
            } 
          });
          addedEdges.add(edgeId);
        }
      }
    });
  });
  
  cy.layout({ name: 'cose', animate: true }).run();
}

// Initial load
loadProfile();
