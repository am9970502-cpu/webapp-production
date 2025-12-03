// Result page
document.addEventListener('DOMContentLoaded', async function() {
    await loadResult();
});

async function loadResult() {
    try {
        // Get worker info
        const workerResponse = await axios.get(`/api/workers/${workerId}`);
        
        if (!workerResponse.data.success) {
            alert('حدث خطأ في تحميل البيانات');
            return;
        }
        
        const worker = workerResponse.data.data;
        
        // Get exam results
        const resultsResponse = await axios.get('/api/admin/results');
        if (!resultsResponse.data.success) {
            alert('حدث خطأ في تحميل النتيجة');
            return;
        }
        
        // Find the latest result for this worker
        const results = resultsResponse.data.data;
        const workerResult = results.find(r => r.worker_id === parseInt(workerId));
        
        if (!workerResult) {
            alert('لم يتم العثور على نتيجة');
            return;
        }
        
        displayResult(worker, workerResult);
    } catch (error) {
        console.error('Error loading result:', error);
        alert('حدث خطأ في تحميل النتيجة');
    }
}

function displayResult(worker, result) {
    const container = document.getElementById('resultCard');
    const passed = result.passed === 1;
    
    container.innerHTML = '';
    
    // Result icon
    const iconDiv = document.createElement('div');
    iconDiv.className = 'mb-8 animate-fadeInDown';
    
    if (passed) {
        iconDiv.innerHTML = `
            <i class="fas fa-trophy text-9xl text-yellow-500 success-animation"></i>
        `;
        createConfetti();
    } else {
        iconDiv.innerHTML = `
            <i class="fas fa-times-circle text-9xl text-red-500 animate-pulse"></i>
        `;
    }
    
    container.appendChild(iconDiv);
    
    // Status
    const statusDiv = document.createElement('div');
    statusDiv.className = `text-5xl font-bold mb-6 animate-fadeInUp ${passed ? 'text-green-600' : 'text-red-600'}`;
    statusDiv.textContent = passed ? 'ناجح' : 'راسب';
    container.appendChild(statusDiv);
    
    // Worker name
    const nameDiv = document.createElement('div');
    nameDiv.className = 'text-2xl font-semibold text-gray-700 mb-4 animate-fadeInUp';
    nameDiv.style.animationDelay = '0.1s';
    nameDiv.innerHTML = `<i class="fas fa-user ml-2"></i>${worker.full_name}`;
    container.appendChild(nameDiv);
    
    // Employee number
    const employeeDiv = document.createElement('div');
    employeeDiv.className = 'text-xl text-gray-600 mb-4 animate-fadeInUp';
    employeeDiv.style.animationDelay = '0.2s';
    employeeDiv.innerHTML = `<i class="fas fa-id-card ml-2"></i>الرقم الوظيفي: ${worker.employee_number}`;
    container.appendChild(employeeDiv);
    
    // Score
    const scoreDiv = document.createElement('div');
    scoreDiv.className = 'bg-gray-100 rounded-2xl p-6 mb-6 animate-fadeInUp';
    scoreDiv.style.animationDelay = '0.3s';
    
    const scoreText = document.createElement('div');
    scoreText.className = 'text-3xl font-bold text-teal-700 mb-2';
    scoreText.innerHTML = `<i class="fas fa-chart-line ml-2"></i>النتيجة`;
    
    const scoreValue = document.createElement('div');
    scoreValue.className = `text-6xl font-bold ${passed ? 'text-green-600' : 'text-red-600'}`;
    scoreValue.textContent = `${result.percentage.toFixed(0)}%`;
    
    const scoreDetails = document.createElement('div');
    scoreDetails.className = 'text-xl text-gray-600 mt-2';
    scoreDetails.textContent = `${result.score} من 20 سؤال`;
    
    scoreDiv.appendChild(scoreText);
    scoreDiv.appendChild(scoreValue);
    scoreDiv.appendChild(scoreDetails);
    container.appendChild(scoreDiv);
    
    // Message
    const messageDiv = document.createElement('div');
    messageDiv.className = 'text-xl text-gray-700 mb-6 animate-fadeInUp';
    messageDiv.style.animationDelay = '0.4s';
    
    if (passed) {
        messageDiv.innerHTML = `
            <p class="mb-2">🎉 مبروك! لقد اجتزت الاختبار بنجاح</p>
            <p>أنت الآن مؤهل للعمل وفقاً لمعايير السلامة المهنية</p>
        `;
    } else {
        messageDiv.innerHTML = `
            <p class="mb-2">للأسف، لم تتمكن من اجتياز الاختبار</p>
            <p>الحد الأدنى للنجاح: 70%</p>
            <p class="mt-2">يرجى مراجعة المواد التدريبية والمحاولة مرة أخرى</p>
        `;
    }
    
    container.appendChild(messageDiv);
    
    // Home button
    const homeButton = document.createElement('button');
    homeButton.className = 'bg-teal-600 hover:bg-teal-700 text-white font-bold text-xl px-8 py-4 rounded-full shadow-lg transform hover:scale-105 transition-all duration-300 animate-fadeInUp';
    homeButton.style.animationDelay = '0.5s';
    homeButton.innerHTML = '<i class="fas fa-home ml-2"></i>العودة للصفحة الرئيسية';
    homeButton.onclick = function() {
        window.location.href = '/';
    };
    
    container.appendChild(homeButton);
}

function createConfetti() {
    const colors = ['#FFD700', '#FF6347', '#4169E1', '#32CD32', '#FF69B4', '#FFA500'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 3 + 's';
            confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
            
            document.body.appendChild(confetti);
            
            setTimeout(() => {
                confetti.remove();
            }, 5000);
        }, i * 100);
    }
}
