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
          audio.pause();
          audio.currentTime = 0;
          isPlaying = false;
          clearInterval(fadeOutInterval);
        }
        currentStep++;
      } else {
        clearInterval(fadeOutInterval);
        audio.pause();
        audio.currentTime = 0;
        isPlaying = false;
      }
    }, 20);
  }
}

function fadeInAudio(fadeInDuration) {
  if (audio) {
    const fadeInStep = initialVolume / (fadeInDuration / 20);
    audio.volume = 0;
    clearInterval(fadeInInterval); // Clear any existing interval
    fadeInInterval = setInterval(() => {
      if (audio.volume < initialVolume) {
        audio.volume = Math.min(initialVolume, audio.volume + fadeInStep);
      } else {
        clearInterval(fadeInInterval);
      }
    }, 20);
  }
}




function fadeInAudio(fadeInDuration) {
  if (audio) {
    const fadeInStep = initialVolume / (fadeInDuration / 20);
    audio.volume = 0;
    clearInterval(fadeInInterval); // Clear any existing interval
    fadeInInterval = setInterval(() => {
      if (audio.volume < initialVolume) {
        audio.volume = Math.min(initialVolume, audio.volume + fadeInStep);
      } else {
        clearInterval(fadeInInterval);
      }
    }, 20);
  }
}


document.addEventListener('keydown', (event) => {
  if (event.code === 'Escape') {
    const highlightedItem = document.querySelector('.file-item.highlight');
    if (highlightedItem) {
      const fadeOutDuration = parseInt(highlightedItem.dataset.fadeout, 10) || 3000; // Default to 3000 ms if not set
      fadeOutAudio(fadeOutDuration);
    }
  }

  if (event.code === 'Delete') {
    const highlightedItem = document.querySelector('.file-item.highlight');
    if (highlightedItem) {
      removeFileItem(highlightedItem);
    }
  }

  if (event.code === 'Space') {
    event.preventDefault(); // Prevent the default spacebar action (e.g., scrolling)
    if (currentFile) {
      playAudio(currentFile);
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
      fileList.scrollTop = nextFileItem.offsetTop - fileList.clientHeight / 2 + nextFileItem.clientHeight / 2; // Scroll to make the selected item visible
    }
  }
});

function removeFileItem(item) {
  const nextSibling = item.nextElementSibling;
  const prevSibling = item.previousElementSibling;

  // Remove the item from the list
  fileList.removeChild(item);

  // Update files array
  files = files.filter(file => URL.createObjectURL(file) !== item.dataset.fileUrl);

  // Update currentFile and highlight the next or previous item
  if (nextSibling) {
    nextSibling.classList.add('highlight');
    currentFile = nextSibling.dataset.fileUrl;
  } else if (prevSibling) {
    prevSibling.classList.add('highlight');
    currentFile = prevSibling.dataset.fileUrl;
  } else {
    currentFile = null; // No files left
  }
}

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
        <div>--:--</div> <!-- Placeholder for file length -->
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

      // Update fade-in and fade-out controls
      const fadeInControl = listItem.querySelectorAll('.fade-control')[0];
      const fadeOutControl = listItem.querySelectorAll('.fade-control')[1];
      const fadeInInput = fadeInControl.querySelector('input');
      const fadeOutInput = fadeOutControl.querySelector('input');

      // Store data attributes
      listItem.dataset.fileUrl = fileUrl;
      listItem.dataset.fadein = fadeInInput.value;
      listItem.dataset.fadeout = fadeOutInput.value;

      listItem.addEventListener('click', () => {
        document.querySelectorAll('.file-item').forEach(item => item.classList.remove('highlight'));
        listItem.classList.add('highlight');
        currentFile = fileUrl; // Update currentFile to the file URL
        console.log('Selected file URL:', currentFile);
      });

      listItem.addEventListener('dblclick', () => {
        playAudio(currentFile);
      });

      // Add event listeners for fade-in and fade-out controls
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

      fileList.appendChild(listItem);
      files.push(file); // Store the file object for navigation
    }
  }
}

function playAudio(fileUrl) {
  if (fileUrl) {
    if (audio.src === fileUrl && isPlaying) {
      audio.pause();
      audio.currentTime = 0;
      isPlaying = false;
    } else {
      audio.src = fileUrl;

      const highlightedItem = document.querySelector('.file-item.highlight');
      const fadeInDuration = highlightedItem ? parseInt(highlightedItem.dataset.fadein, 10) || 0 : 0;

      console.log(`Fade-in duration: ${fadeInDuration}`); // Debug log

      audio.volume = 0;

      audio.play().then(() => {
        fadeInAudio(fadeInDuration);
        isPlaying = true;
      }).catch(err => console.error('Playback failed:', err));
    }
  }
}




playButton.addEventListener('click', () => {
  if (currentFile) {
    playAudio(currentFile);
  } else {
    console.error('No file selected.');
  }
});

prevButton.addEventListener('click', () => {
  const fileItems = document.querySelectorAll('.file-item');
  if (fileItems.length === 0) return;

  let index = [...fileItems].indexOf(document.querySelector('.file-item.highlight'));

  index = (index - 1 + fileItems.length) % fileItems.length; // Move up, wrap around to bottom
  const prevFileItem = fileItems[index];
  if (prevFileItem) {
    document.querySelectorAll('.file-item').forEach(item => item.classList.remove('highlight'));
    prevFileItem.classList.add('highlight');
    currentFile = prevFileItem.dataset.fileUrl;
    fileList.scrollTop = prevFileItem.offsetTop - fileList.clientHeight / 2 + prevFileItem.clientHeight / 2; // Scroll to make the selected item visible
  }
});

nextButton.addEventListener('click', () => {
  const fileItems = document.querySelectorAll('.file-item');
  if (fileItems.length === 0) return;

  let index = [...fileItems].indexOf(document.querySelector('.file-item.highlight'));

  index = (index + 1) % fileItems.length; // Move down, wrap around to top
  const nextFileItem = fileItems[index];
  if (nextFileItem) {
    document.querySelectorAll('.file-item').forEach(item => item.classList.remove('highlight'));
    nextFileItem.classList.add('highlight');
    currentFile = nextFileItem.dataset.fileUrl;
    fileList.scrollTop = nextFileItem.offsetTop - fileList.clientHeight / 2 + nextFileItem.clientHeight / 2; // Scroll to make the selected item visible
  }
});

progressBar.addEventListener('input', (event) => {
  const value = event.target.value;
  if (audio.duration) {
    audio.currentTime = (value / 100) * audio.duration;
  }
});

audio.addEventListener('timeupdate', () => {
  if (audio.duration) {
    progressBar.value = (audio.currentTime / audio.duration) * 100;
  }
});
