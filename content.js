// content.js - Modified version to place elements below links
console.log("UbuWeb Checkboxer: Content script loaded");

// Function to add checkboxes and note buttons
function addCheckboxes() {
  // Target all links in the main content table
  const links = document.querySelectorAll("a");
  let count = 0;
  
  links.forEach(link => {
    // Skip links that don't have a parent element or are not in a table cell
    if (!link.parentElement || link.parentElement.tagName !== "TD") return;
    
    // Skip if already has our container (prevents duplication)
    // Modified check to look after the link instead of before
    if (link.nextElementSibling && 
        (link.nextElementSibling.classList.contains('ubu-container') || 
         link.nextElementSibling.type === "checkbox")) return;
    
    // Generate a simple unique key for this item
    const title = link.textContent.trim();
    const key = `ubuweb-${title.substring(0, 30)}-${link.href.substring(0, 30)}`.replace(/[^a-zA-Z0-9]/g, '');
    const noteKey = `note-${key}`;
    
    // Create container for checkbox and note button
    const container = document.createElement('div');
    container.classList.add('ubu-container');
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.marginTop = "3px"; // Change from marginBottom to marginTop
    
    // Create checkbox
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.style.marginRight = "5px";
    
    // Create note button
    const noteButton = document.createElement('button');
    noteButton.textContent = "Add Note";
    noteButton.style.marginLeft = "5px";
    noteButton.style.fontSize = "12px";
    noteButton.style.padding = "1px 4px";
    noteButton.style.cursor = "pointer";
    noteButton.dataset.itemKey = key;
    noteButton.dataset.itemTitle = title;
    
    // Add event listener to note button
    noteButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Get existing note if any
      chrome.storage.local.get(noteKey, (result) => {
        const existingNote = result[noteKey] || '';
        // Send message to background script to open a popup window
        chrome.runtime.sendMessage({
          action: "openNoteWindow",
          key: key,
          title: title,
          note: existingNote
        });
      });
    });
    
    // Load checkbox state from storage
    chrome.storage.local.get(key, (result) => {
      checkbox.checked = result[key] === true;
    });
    
    // Load note state from storage
    chrome.storage.local.get(noteKey, (result) => {
      if (result[noteKey]) {
        noteButton.textContent = "Edit Note";
        const indicator = document.createElement('span');
        indicator.style.display = "inline-block";
        indicator.style.width = "8px";
        indicator.style.height = "8px";
        indicator.style.backgroundColor = "#ffc107";
        indicator.style.borderRadius = "50%";
        indicator.style.marginRight = "3px";
        noteButton.prepend(indicator);
        container.style.backgroundColor = "#fffde7";
      }
    });
    
    // Save checkbox state when changed
    checkbox.addEventListener("change", () => {
      const storeObj = {};
      storeObj[key] = checkbox.checked;
      chrome.storage.local.set(storeObj);
    });
    
    // Add elements to container
    container.appendChild(checkbox);
    container.appendChild(noteButton);
    
    // Insert container after link (key change)
    if (link.nextSibling) {
      link.parentElement.insertBefore(container, link.nextSibling);
    } else {
      link.parentElement.appendChild(container);
    }
    
    count++;
  });
  
  console.log(`UbuWeb Checkboxer: Added ${count} checkbox+note containers`);
  
  // Listen for messages from the popup window
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "saveNote") {
      const key = message.key;
      const noteText = message.note;
      const noteKey = `note-${key}`;
      
      // Save the note
      const storeObj = {};
      storeObj[noteKey] = noteText;
      
      chrome.storage.local.set(storeObj, () => {
        // Update UI to reflect note status
        const noteButtons = document.querySelectorAll(`[data-item-key="${key}"]`);
        noteButtons.forEach(btn => {
          const container = btn.parentElement;
          
          if (noteText) {
            btn.textContent = "Edit Note";
            const indicator = document.createElement('span');
            indicator.style.display = "inline-block";
            indicator.style.width = "8px";
            indicator.style.height = "8px";
            indicator.style.backgroundColor = "#ffc107";
            indicator.style.borderRadius = "50%";
            indicator.style.marginRight = "3px";
            btn.prepend(indicator);
            container.style.backgroundColor = "#fffde7";
          } else {
            btn.textContent = "Add Note";
            container.style.backgroundColor = "";
          }
        });
        
        // Send confirmation back
        sendResponse({success: true});
      });
      
      return true; // Required for async response
    }
  });
}

// Only call once with a longer delay to ensure page is fully loaded
setTimeout(addCheckboxes, 500);