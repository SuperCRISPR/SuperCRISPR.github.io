let musicList = [];
let currentIndex = 0;
let audio = new Audio();
let isPlaying = false;

// 读取 JSON 文件并生成播放列表
// 读取 JSON 文件并生成播放列表
fetch('info.json')
    .then(response => response.json())
    .then(data => {
        musicList = Object.keys(data).map((key, index) => {
            return {
                filepath: data[key]['Filepath'],
                title: data[key]['Title'],
                composer: data[key]['Composer'],
                subtitle: data[key]['Subtitle'],
                number: data[key]['Number'],
                time: data[key]['Time'],
            };
        });
        shufflePlaylist();  // 打开页面时生成一个随机顺序的歌单列表
        loadSong(currentIndex); // 加载第一首歌
    })
    .catch(error => console.error('Error loading JSON:', error));


// 加载歌曲
function loadSong(index) {
    const song = musicList[index];
    audio.src = song.filepath;
    document.getElementById('composer').textContent = song.composer;
    document.getElementById('title').textContent = song.title;
    document.getElementById('subtitle').textContent = song.subtitle;
    document.getElementById('details').textContent = song.number + ' | ' + song.time;
}

// 播放歌曲
function playSong() {
    audio.play();
    isPlaying = true;
    document.getElementById('play-pause-button').textContent = "Pause";
}

// 暂停歌曲
function pauseSong() {
    audio.pause();
    isPlaying = false;
    document.getElementById('play-pause-button').textContent = "Play";
}

// 切换播放/暂停
function togglePlayPause() {
    if (isPlaying) {
        pauseSong();
    } else {
        playSong();
    }
}

// 切换到下一首歌
function nextSong() {
    currentIndex = (currentIndex + 1) % musicList.length;
    loadSong(currentIndex);
    playSong();
}

// 切换到上一首歌
function prevSong() {
    currentIndex = (currentIndex - 1 + musicList.length) % musicList.length;
    loadSong(currentIndex);
    playSong();
}

// 调节音量
function setVolume(value) {
    audio.volume = value / 100;
}

// 随机排序播放列表
function shufflePlaylist() {
    musicList.sort(() => Math.random() - 0.5);
    renderSongList();
}

// 按年份排序播放列表
function sortByYear() {
    musicList.sort((a, b) => a.time.localeCompare(b.time));
    renderSongList();
}

// 渲染歌单列表
function renderSongList() {
    const list = document.getElementById('song-list');
    list.innerHTML = '';
    musicList.forEach((song, index) => {
        const item = document.createElement("li");
        item.className = "song-item";
        item.innerHTML = `<div>${song.composer}</div><div><b>${song.title}</b></div><div>${song.subtitle}</div>`;
        item.addEventListener("click", () => {
            currentIndex = index;
            loadSong(currentIndex);
            playSong();
        });
        list.appendChild(item);
    });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    audio.volume = 0.5; // 初始音量值为50%
    document.getElementById('play-pause-button').addEventListener("click", togglePlayPause);
    document.getElementById('next-button').addEventListener("click", nextSong);
    document.getElementById('prev-button').addEventListener("click", prevSong);
    document.getElementById('volume-slider').addEventListener("input", (e) => setVolume(e.target.value));
    document.getElementById('sort-random').addEventListener("click", shufflePlaylist);
    document.getElementById('sort-year').addEventListener("click", sortByYear);
});
