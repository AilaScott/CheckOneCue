const dropZone = document.getElementById('drop-zone');
const fileList = document.getElementById('file-list-items');
const playButton = document.getElementById('play-button');
const prevButton = document.getElementById('prev-button');
const nextButton = document.getElementById('next-button');
const progressBar = document.getElementById('progress-bar');

let audio = new Audio();
let currentFile = null;
let isPlaying = false;
let files = []; // Store all files for navigation
let fadeInInterval; // For fade-in effect
let fadeOutInterval; // For fade-out effect
let initialVolume = 1; // Default Volume Level

// Function to format time in mm:ss:ms
function formatTime(milliseconds) {
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  const ms = Math.floor(milliseconds % 1000 / 10);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(ms).padStart(2, '0')}`;
}

// Function to handle fade-out effect
function fadeOutAudio(fadeOutDuration) {
  if (audio && isPlaying) {
    const initialVolume = audio.volume;
    const fadeOutSteps = fadeOutDuration / 20;
    const volumeDecrement = initialVolume / fadeOutSteps;

    let currentStep = 0;
    clearInterval(fadeOutInterval); // Clear any existing interval
    fadeOutInterval = setInterval(() => {
      if (currentStep < fadeOutSteps) {
        audio.volume = Math.max(0, audio.volume - volumeDecrement);
        if (audio.volume === 0) {
          stopAudio(); // Use stopAudio to reset playback state
        }
        currentStep++;
      } else {
        clearInterval(fadeOutInterval);
        stopAudio(); // Ensure stopping the audio
      }
    }, 20);
  }
}

// Function to handle fade-in effect
function fadeInAudio(fadeInDuration) {
  if (audio && !isPlaying) {
    audio.volume = 0; // Set initial volume to 0

    audio.play().then(() => {
      isPlaying = true;

      const fadeInStep = initialVolume / (fadeInDuration / 20); // Calculate fade-in step
      let fadeInVolume = 0;
      clearInterval(fadeInInterval);

      fadeInInterval = setInterval(() => {
        if (fadeInVolume < initialVolume) {
          fadeInVolume = Math.min(initialVolume, fadeInVolume + fadeInStep);
          audio.volume = fadeInVolume;
        } else {
          clearInterval(fadeInInterval);
        }
      }, 20);
    }).catch(err => {
      console.error('Audio playback failed:', err);
      isPlaying = false; // Ensure playback state is reset on error
    });
  }
}

// Function to stop audio playback
function stopAudio() {
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
    isPlaying = false;
  }
}

// Function to play selected audio file
function playAudio(fileUrl) {
  if (fileUrl) {
    if (audio.src === fileUrl) {
      if (isPlaying) {
        fadeOutAudio(3000); // Default fade-out duration of 3000 ms
      } else {
        fadeInAudio(0); // Immediate start if the same file is selected and not playing
      }
    } else {
      stopAudio(); // Stop any current playback
      audio.src = fileUrl;
      const highlightedItem = document.querySelector('.file-item.highlight');
      const fadeInDuration = highlightedItem ? parseInt(highlightedItem.dataset.fadein, 10) || 0 : 0;

      console.log(`Fade-in duration: ${fadeInDuration}`); // Debug log

      fadeInAudio(fadeInDuration);
    }
  } else {
    console.error('No file selected.');
  }
}

// Function to update file length display
function updateFileLength(listItem, fileUrl) {
  const tempAudio = new Audio(fileUrl);
  tempAudio.addEventListener('loadedmetadata', () => {
    const duration = tempAudio.duration * 1000; // Duration in milliseconds
    const formattedDuration = formatTime(duration);
    listItem.querySelector('.file-length').textContent = formattedDuration;
  });
}

// Handle file drag-and-drop
dropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  event.stopPropagation();
  dropZone.style.backgroundColor = '#e0e0e0'; // Optional: Highlight drop zone
});

dropZone.addEventListener('dragleave', (event) => {
  event.preventDefault();
  event.stopPropagation();
  dropZone.style.backgroundColor = ''; // Reset drop zone color
});

dropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  event.stopPropagation();
  dropZone.style.backgroundColor = ''; // Reset drop zone color

  const droppedFiles = event.dataTransfer.files;
  handleFiles(droppedFiles);
});

// Function to handle dropped files
function handleFiles(newFiles) {
  const currentFileUrls = Array.from(document.querySelectorAll('#file-list-items .file-item'))
                               .map(item => item.dataset.fileUrl);

  for (const file of newFiles) {
    const fileUrl = URL.createObjectURL(file);
    if (!currentFileUrls.includes(fileUrl)) {
      const listItem = document.createElement('div');
      listItem.className = 'file-item';
      listItem.innerHTML = `
        <div>${file.name}</div>
        <div class="file-length">--:--:--</div> <!-- Placeholder for file length -->
        <div><input type="checkbox"></div>
        <div class="fade-control">
          <input type="number" value="0" min="0" step="100"> <!-- Set default value to 0 -->
          <button>+</button>
          <button>-</button>
        </div>
        <div class="fade-control">
          <input type="number" value="3000" min="0" step="100">
          <button>+</button>
          <button>-</button>
        </div>
      `;

      // Set initial data attributes
      const fadeInInput = listItem.querySelector('.fade-control input');
      const fadeOutInput = listItem.querySelectorAll('.fade-control input')[1];
      listItem.dataset.fileUrl = fileUrl;
      listItem.dataset.fadein = fadeInInput.value;
      listItem.dataset.fadeout = fadeOutInput.value;

      // Update file length
      updateFileLength(listItem, fileUrl);

      // Handle fade control updates
      handleFadeControlUpdates(listItem);

      listItem.addEventListener('click', () => {
        document.querySelectorAll('.file-item').forEach(item => item.classList.remove('highlight'));
        listItem.classList.add('highlight');
        currentFile = fileUrl; // Update currentFile to the file URL
      });

      fileList.appendChild(listItem);
      files.push(file); // Add the file to the list of files
    }
  }
}

// Function to handle fade control updates
function handleFadeControlUpdates(listItem) {
  const fadeInControl = listItem.querySelectorAll('.fade-control')[0];
  const fadeOutControl = listItem.querySelectorAll('.fade-control')[1];
  const fadeInInput = fadeInControl.querySelector('input');
  const fadeOutInput = fadeOutControl.querySelector('input');

  fadeInInput.addEventListener('input', () => {
    listItem.dataset.fadein = fadeInInput.value;
  });

  fadeOutInput.addEventListener('input', () => {
    listItem.dataset.fadeout = fadeOutInput.value;
  });

  // Add event listeners for fade-in and fade-out control buttons
  fadeInControl.querySelector('button:nth-child(2)').addEventListener('click', () => {
    fadeInInput.value = parseInt(fadeInInput.value) + 100;
    listItem.dataset.fadein = fadeInInput.value;
  });

  fadeInControl.querySelector('button:nth-child(3)').addEventListener('click', () => {
    fadeInInput.value = Math.max(0, parseInt(fadeInInput.value) - 100);
    listItem.dataset.fadein = fadeInInput.value;
  });

  fadeOutControl.querySelector('button:nth-child(2)').addEventListener('click', () => {
    fadeOutInput.value = parseInt(fadeOutInput.value) + 100;
    listItem.dataset.fadeout = fadeOutInput.value;
  });

  fadeOutControl.querySelector('button:nth-child(3)').addEventListener('click', () => {
    fadeOutInput.value = Math.max(0, parseInt(fadeOutInput.value) - 100);
    listItem.dataset.fadeout = fadeOutInput.value;
  });
}

// Handle keyboard shortcuts
document.addEventListener('keydown', (event) => {
  if (event.code === 'Space') {
    event.preventDefault(); // Prevent the default spacebar action (e.g., scrolling)
    if (currentFile) {
      if (isPlaying) {
        stopAudio(); // Stop playback if already playing
      } else {
        playAudio(currentFile);
      }
    } else {
      console.error('No file selected.');
    }
  }

  if (event.code === 'ArrowDown' || event.code === 'ArrowUp') {
    event.preventDefault(); // Prevent default scrolling action
    const fileItems = document.querySelectorAll('.file-item');
    if (fileItems.length === 0) return;

    let index = [...fileItems].indexOf(document.querySelector('.file-item.highlight'));

    if (event.code === 'ArrowDown') {
      index = (index + 1) % fileItems.length; // Move down, wrap around to top
    } else if (event.code === 'ArrowUp') {
      index = (index - 1 + fileItems.length) % fileItems.length; // Move up, wrap around to bottom
    }

    const nextFileItem = fileItems[index];
    if (nextFileItem) {
      document.querySelectorAll('.file-item').forEach(item => item.classList.remove('highlight'));
      nextFileItem.classList.add('highlight');
      currentFile = nextFileItem.dataset.fileUrl; // Update currentFile to match the selected file URL
      nextFileItem.scrollIntoView({ behavior: 'smooth', block: 'center' }); // Smooth scroll to the selected item
    }
  }
});

// Function to remove a file item
function removeFileItem(listItem) {
  fileList.removeChild(listItem);
  files = files.filter(file => URL.createObjectURL(file) !== listItem.dataset.fileUrl);
}

// Set up event listeners for play, prev, and next buttons
playButton.addEventListener('click', () => {
  if (currentFile) {
    playAudio(currentFile);
  } else {
    console.error('No file selected.');
  }
});

prevButton.addEventListener('click', () => {
  const highlightedItem = document.querySelector('.file-item.highlight');
  if (highlightedItem) {
    const currentIndex = [...fileList.children].indexOf(highlightedItem);
    const prevIndex = (currentIndex - 1 + fileList.children.length) % fileList.children.length;
    const prevItem = fileList.children[prevIndex];
    if (prevItem) {
      document.querySelectorAll('.file-item').forEach(item => item.classList.remove('highlight'));
      prevItem.classList.add('highlight');
      currentFile = prevItem.dataset.fileUrl;
      playAudio(currentFile);
    }
  }
});

nextButton.addEventListener('click', () => {
  const highlightedItem = document.querySelector('.file-item.highlight');
  if (highlightedItem) {
    const currentIndex = [...fileList.children].indexOf(highlightedItem);
    const nextIndex = (currentIndex + 1) % fileList.children.length;
    const nextItem = fileList.children[nextIndex];
    if (nextItem) {
      document.querySelectorAll('.file-item').forEach(item => item.classList.remove('highlight'));
      nextItem.classList.add('highlight');
      currentFile = nextItem.dataset.fileUrl;
      playAudio(currentFile);
    }
  }
});

// Handle playback progress
audio.addEventListener('timeupdate', () => {
  const progress = (audio.currentTime / audio.duration) * 100;
  progressBar.value = progress || 0;
});

progressBar.addEventListener('input', (event) => {
  const seekTime = (event.target.value / 100) * audio.duration;
  audio.currentTime = seekTime;
});
