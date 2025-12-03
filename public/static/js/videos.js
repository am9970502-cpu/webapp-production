// Videos page
let videos = [];
let watchedVideos = new Set();
let currentVideo = null;

document.addEventListener('DOMContentLoaded', async function() {
    await loadVideos();
    await loadProgress();
    checkExamButton();
});

async function loadVideos() {
    try {
        const response = await axios.get('/api/videos');
        if (response.data.success) {
            videos = response.data.data;
            displayVideos();
        }
    } catch (error) {
        console.error('Error loading videos:', error);
    }
}

async function loadProgress() {
    try {
        const response = await axios.get(`/api/videos/progress/${workerId}`);
        if (response.data.success) {
            response.data.data.forEach(progress => {
                if (progress.watched === 1) {
                    watchedVideos.add(progress.video_id);
                }
            });
            updateWatchedStatus();
        }
    } catch (error) {
        console.error('Error loading progress:', error);
    }
}

function displayVideos() {
    const container = document.getElementById('videosContainer');
    
    // Group videos by section
    const sections = {};
    videos.forEach(video => {
        if (!sections[video.section_name]) {
            sections[video.section_name] = [];
        }
        sections[video.section_name].push(video);
    });
    
    // Sort sections by section_order
    const sortedSections = Object.entries(sections).sort((a, b) => {
        return a[1][0].section_order - b[1][0].section_order;
    });
    
    container.innerHTML = '';
    
    sortedSections.forEach(([sectionName, sectionVideos]) => {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'bg-white rounded-2xl shadow-xl p-6 animate-fadeInUp';
        
        const sectionTitle = document.createElement('h2');
        sectionTitle.className = 'text-2xl font-bold text-teal-700 mb-4';
        sectionTitle.innerHTML = `<i class="fas fa-folder-open ml-2"></i>${sectionName}`;
        sectionDiv.appendChild(sectionTitle);
        
        const videosGrid = document.createElement('div');
        videosGrid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
        
        // Sort videos by video_order
        sectionVideos.sort((a, b) => a.video_order - b.video_order);
        
        sectionVideos.forEach((video, index) => {
            const videoCard = createVideoCard(video, index);
            videosGrid.appendChild(videoCard);
        });
        
        sectionDiv.appendChild(videosGrid);
        container.appendChild(sectionDiv);
    });
}

function createVideoCard(video, index) {
    const card = document.createElement('div');
    card.className = 'video-card bg-gray-100 rounded-xl p-4 shadow-lg';
    card.id = `video-card-${video.id}`;
    
    const isWatched = watchedVideos.has(video.id);
    if (isWatched) {
        card.classList.add('watched');
    }
    
    const title = document.createElement('h3');
    title.className = 'text-lg font-bold text-gray-800 mb-2';
    title.textContent = video.video_title;
    card.appendChild(title);
    
    const videoElement = document.createElement('video');
    videoElement.className = 'w-full rounded-lg mb-2';
    videoElement.controls = true;
    videoElement.id = `video-${video.id}`;
    videoElement.src = `/api/videos/stream/${encodeURIComponent(video.video_url)}`;
    card.appendChild(videoElement);
    
    if (isWatched) {
        const watchedBadge = document.createElement('div');
        watchedBadge.className = 'bg-green-500 text-white px-4 py-2 rounded-lg text-center font-bold';
        watchedBadge.innerHTML = '<i class="fas fa-check-circle ml-2"></i>تم المشاهدة';
        card.appendChild(watchedBadge);
    }
    
    // Video event listeners
    videoElement.addEventListener('play', function() {
        if (currentVideo && currentVideo !== videoElement) {
            currentVideo.pause();
        }
        currentVideo = videoElement;
        card.classList.add('playing');
    });
    
    videoElement.addEventListener('pause', function() {
        card.classList.remove('playing');
    });
    
    videoElement.addEventListener('ended', async function() {
        card.classList.remove('playing');
        
        if (!watchedVideos.has(video.id)) {
            await markVideoWatched(video.id);
            watchedVideos.add(video.id);
            updateWatchedStatus();
            checkExamButton();
            
            const watchedBadge = document.createElement('div');
            watchedBadge.className = 'bg-green-500 text-white px-4 py-2 rounded-lg text-center font-bold animate-fadeInUp';
            watchedBadge.innerHTML = '<i class="fas fa-check-circle ml-2"></i>تم المشاهدة';
            card.appendChild(watchedBadge);
            
            card.classList.add('watched');
        }
    });
    
    return card;
}

async function markVideoWatched(videoId) {
    try {
        await axios.post('/api/videos/watch', {
            worker_id: workerId,
            video_id: videoId
        });
    } catch (error) {
        console.error('Error marking video as watched:', error);
    }
}

function updateWatchedStatus() {
    videos.forEach(video => {
        const card = document.getElementById(`video-card-${video.id}`);
        if (card && watchedVideos.has(video.id)) {
            card.classList.add('watched');
        }
    });
}

function checkExamButton() {
    const examButton = document.getElementById('examButton');
    
    if (watchedVideos.size === videos.length && videos.length > 0) {
        examButton.disabled = false;
        examButton.className = 'bg-green-600 hover:bg-green-700 text-white font-bold text-xl px-12 py-6 rounded-full shadow-2xl transform hover:scale-110 transition-all duration-300 cursor-pointer animate-pulse';
        examButton.onclick = function() {
            window.location.href = `/exam/${workerId}`;
        };
    } else {
        examButton.disabled = true;
        examButton.className = 'bg-gray-400 text-white font-bold text-xl px-12 py-6 rounded-full shadow-2xl cursor-not-allowed';
    }
}
