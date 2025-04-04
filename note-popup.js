// note-popup.js - Handles the note popup window functionality

// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const itemKey = urlParams.get('key');
const itemTitle = urlParams.get('title');
const initialNote = urlParams.get('note');

// Set title and initial note content
document.getElementById('note-title').textContent = `Notes for: ${itemTitle}`;
document.getElementById('note-content').value = initialNote;

// Focus on the textarea
document.getElementById('note-content').focus();

// Handle Save button click
document.getElementById('save-button').addEventListener('click', () => {
  const noteText = document.getElementById('note-content').value.trim();
  
  // Send message to content script to save the note
  chrome.tabs.query({active: true, currentWindow: false}, (tabs) => {
    // Find the tab that opened this popup (the UbuWeb tab)
    chrome.tabs.query({}, (allTabs) => {
      // Look for tabs matching UbuWeb URLs
      const ubuTabs = allTabs.filter(tab => 
        tab.url && (
          tab.url.includes('ubu.com/film/index.html') || 
          tab.url.includes('ubuweb.com/film/index.html')
        )
      );
      
      if (ubuTabs.length > 0) {
        // Send message to the UbuWeb tab
        chrome.tabs.sendMessage(ubuTabs[0].id, {
          action: "saveNote",
          key: itemKey,
          note: noteText
        }, (response) => {
          if (response && response.success) {
            // Close the window
            window.close();
          }
        });
      }
    });
  });
});

// Handle Cancel button click
document.getElementById('cancel-button').addEventListener('click', () => {
  window.close();
});

// Handle Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    window.close();
  }
});