// Admin Videos Management
let videos = [];

document.addEventListener('DOMContentLoaded', async function() {
    await loadVideos();
});

// Upload new video
document.getElementById('uploadVideoForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const section_name = document.getElementById('section_name').value.trim();
    const video_title = document.getElementById('video_title').value.trim();
    const section_order = document.getElementById('section_order').value;
    const video_order = document.getElementById('video_order').value;
    const video_file = document.getElementById('video_file').files[0];
    
    if (!video_file) {
        alert('يرجى اختيار ملف فيديو');
        return;
    }
    
    const formData = new FormData();
    formData.append('section_name', section_name);
    formData.append('video_title', video_title);
    formData.append('section_order', section_order);
    formData.append('video_order', video_order);
    formData.append('video', video_file);
    
    try {
        document.getElementById('uploadProgress').classList.remove('hidden');
        
        const response = await axios.post('/api/admin/videos', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: function(progressEvent) {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                document.getElementById('progressBar').style.width = percentCompleted + '%';
                document.getElementById('progressText').textContent = `جاري الرفع... ${percentCompleted}%`;
            }
        });
        
        if (response.data.success) {
            alert('تم رفع الفيديو بنجاح');
            document.getElementById('uploadVideoForm').reset();
            document.getElementById('uploadProgress').classList.add('hidden');
            document.getElementById('progressBar').style.width = '0%';
            await loadVideos();
        }
    } catch (error) {
        alert('حدث خطأ في رفع الفيديو');
        document.getElementById('uploadProgress').classList.add('hidden');
        document.getElementById('progressBar').style.width = '0%';
    }
});

// Load all videos
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

function displayVideos() {
    const container = document.getElementById('videosContainer');
    container.innerHTML = '';
    
    if (videos.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-600">لا توجد فيديوهات</p>';
        return;
    }
    
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
    
    sortedSections.forEach(([sectionName, sectionVideos]) => {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'bg-gray-50 rounded-xl p-4 shadow-md';
        
        const sectionHeader = document.createElement('h3');
        sectionHeader.className = 'text-xl font-bold text-teal-700 mb-3';
        sectionHeader.innerHTML = `<i class="fas fa-folder-open ml-2"></i>${sectionName} (ترتيب: ${sectionVideos[0].section_order})`;
        sectionDiv.appendChild(sectionHeader);
        
        const videosList = document.createElement('div');
        videosList.className = 'space-y-2';
        
        // Sort videos by video_order
        sectionVideos.sort((a, b) => a.video_order - b.video_order);
        
        sectionVideos.forEach(video => {
            const videoItem = document.createElement('div');
            videoItem.className = 'flex justify-between items-center bg-white p-3 rounded-lg';
            
            const videoInfo = document.createElement('div');
            videoInfo.innerHTML = `
                <span class="font-semibold">${video.video_title}</span>
                <span class="text-gray-600 text-sm mr-2">(ترتيب: ${video.video_order})</span>
            `;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.onclick = () => deleteVideo(video.id);
            
            videoItem.appendChild(videoInfo);
            videoItem.appendChild(deleteBtn);
            videosList.appendChild(videoItem);
        });
        
        sectionDiv.appendChild(videosList);
        container.appendChild(sectionDiv);
    });
}

async function deleteVideo(id) {
    if (!confirm('هل أنت متأكد من حذف هذا الفيديو؟')) return;
    
    try {
        const response = await axios.delete(`/api/admin/videos/${id}`);
        
        if (response.data.success) {
            alert('تم حذف الفيديو بنجاح');
            await loadVideos();
        }
    } catch (error) {
        alert('حدث خطأ في حذف الفيديو');
    }
}
