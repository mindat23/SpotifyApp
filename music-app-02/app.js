const fileInput = document.getElementById("fileInput");
const audioPlayer = document.getElementById("audioPlayer");
const currentSongName = document.getElementById("currentSongName");
const bottomCurrentSong = document.getElementById("bottomCurrentSong");
const togglePlayBtn = document.getElementById("togglePlayBtn");
const playFavoritesBtn = document.getElementById("playFavoritesBtn");
const shuffleFavoritesBtn = document.getElementById("shuffleFavoritesBtn");
const songList = document.getElementById("songList");
const totalSongs = document.getElementById("totalSongs");
const totalFavorites = document.getElementById("totalFavorites");
const playlistCount = document.getElementById("playlistCount");

let songs = [];
let currentSongId = null;
let currentQueue = [];
let currentQueueIndex = -1;

fileInput.addEventListener("change", handleUploadSongs);
togglePlayBtn.addEventListener("click", handleTogglePlay);
playFavoritesBtn.addEventListener("click", handlePlayAllFavorites);
shuffleFavoritesBtn.addEventListener("click", handleShuffleFavorites);
audioPlayer.addEventListener("ended", handleSongEnded);

function handleUploadSongs(event) {
  const files = Array.from(event.target.files);

  if (!files.length) return;

  const newSongs = files
    .filter((file) => file.type === "audio/mpeg" || file.name.toLowerCase().endsWith(".mp3"))
    .map((file, index) => ({
      id: `${Date.now()}-${index}-${file.name}`,
      name: file.name.replace(/\.mp3$/i, ""),
      file,
      url: URL.createObjectURL(file),
      isFavorite: false
    }));

  songs = [...songs, ...newSongs];

  renderSongList();
  updateStats();
}

function renderSongList() {
  if (songs.length === 0) {
    songList.innerHTML = `<p class="empty-text">Chưa có dữ liệu. Hãy upload file mp3.</p>`;
    return;
  }

  songList.innerHTML = songs
    .map((song, index) => {
      const isActive = song.id === currentSongId;
      const favoriteText = song.isFavorite ? "&#9733; Favorite" : "&#9734; Favorite";
      const playText = isActive && !audioPlayer.paused ? "Pause" : "Play";

      return `
        <div class="song-item ${isActive ? "active" : ""}">
          <div class="song-thumb">${index + 1}</div>

          <div class="song-info">
            <p class="song-name">${escapeHtml(song.name)}</p>
            <p class="song-meta">${escapeHtml(song.file.name)}</p>
          </div>

          <div class="song-actions">
            <button class="song-btn play-btn" data-action="play" data-id="${song.id}">
              ${playText}
            </button>

            <button class="song-btn favorite-btn ${song.isFavorite ? "active" : ""}" data-action="favorite" data-id="${song.id}">
              ${favoriteText}
            </button>
          </div>
        </div>
      `;
    })
    .join("");

  bindSongActions();
}

function bindSongActions() {
  const actionButtons = document.querySelectorAll("[data-action]");

  actionButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const action = this.dataset.action;
      const songId = this.dataset.id;

      if (action === "play") {
        handleSongPlay(songId);
      }

      if (action === "favorite") {
        toggleFavorite(songId);
      }
    });
  });
}

function handleSongPlay(songId) {
  const selectedSong = songs.find((song) => song.id === songId);

  if (!selectedSong) return;

  if (currentSongId === songId) {
    if (audioPlayer.paused) {
      audioPlayer.play();
      togglePlayBtn.textContent = "Pause";
    } else {
      audioPlayer.pause();
      togglePlayBtn.textContent = "Play";
    }

    renderSongList();
    return;
  }

  currentSongId = songId;
  currentQueue = [songId];
  currentQueueIndex = 0;

  audioPlayer.src = selectedSong.url;
  audioPlayer.play();

  currentSongName.textContent = selectedSong.name;
  bottomCurrentSong.textContent = selectedSong.name;
  togglePlayBtn.textContent = "Pause";

  renderSongList();
}

function handleTogglePlay() {
  if (!currentSongId) {
    alert("Hãy chọn một bài hát trước.");
    return;
  }

  if (audioPlayer.paused) {
    audioPlayer.play();
    togglePlayBtn.textContent = "Pause";
  } else {
    audioPlayer.pause();
    togglePlayBtn.textContent = "Play";
  }

  renderSongList();
}

function toggleFavorite(songId) {
  songs = songs.map((song) => {
    if (song.id === songId) {
      return {
        ...song,
        isFavorite: !song.isFavorite
      };
    }
    return song;
  });

  renderSongList();
  updateStats();
}

function handlePlayAllFavorites() {
  const favoriteSongs = songs.filter((song) => song.isFavorite);

  if (favoriteSongs.length === 0) {
    alert("Chưa có bài hát favorite.");
    return;
  }

  currentQueue = favoriteSongs.map((song) => song.id);
  currentQueueIndex = 0;

  playSongByQueueIndex();
}

function handleShuffleFavorites() {
  const favoriteSongs = songs.filter((song) => song.isFavorite);

  if (favoriteSongs.length === 0) {
    alert("Chưa có bài hát favorite để shuffle.");
    return;
  }

  const shuffled = shuffleArray([...favoriteSongs]);

  currentQueue = shuffled.map((song) => song.id);
  currentQueueIndex = 0;

  playSongByQueueIndex();
}

function playSongByQueueIndex() {
  if (currentQueueIndex < 0 || currentQueueIndex >= currentQueue.length) return;

  const songId = currentQueue[currentQueueIndex];
  const song = songs.find((item) => item.id === songId);

  if (!song) return;

  currentSongId = song.id;
  audioPlayer.src = song.url;
  audioPlayer.play();

  currentSongName.textContent = song.name;
  bottomCurrentSong.textContent = song.name;
  togglePlayBtn.textContent = "Pause";

  renderSongList();
}

function handleSongEnded() {
  if (currentQueue.length > 1 && currentQueueIndex < currentQueue.length - 1) {
    currentQueueIndex += 1;
    playSongByQueueIndex();
    return;
  }

  togglePlayBtn.textContent = "Play";
  renderSongList();
}

function updateStats() {
  totalSongs.textContent = songs.length;
  totalFavorites.textContent = songs.filter((song) => song.isFavorite).length;
  playlistCount.textContent = `${songs.length} bài hát`;
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [array[i], array[randomIndex]] = [array[randomIndex], array[i]];
  }

  return array;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

