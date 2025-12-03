// Exam page
let questions = [];
let timeLeft = 600; // 10 minutes in seconds
let timerInterval;

document.addEventListener('DOMContentLoaded', async function() {
    await loadQuestions();
    startTimer();
});

async function loadQuestions() {
    try {
        const response = await axios.get(`/api/questions/random/${workerId}`);
        if (response.data.success) {
            questions = response.data.data;
            displayQuestions();
        }
    } catch (error) {
        if (error.response && error.response.data) {
            alert(error.response.data.message);
            window.location.href = '/';
        } else {
            console.error('Error loading questions:', error);
        }
    }
}

function displayQuestions() {
    const container = document.getElementById('questionsContainer');
    container.innerHTML = '';
    
    questions.forEach((question, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'bg-gray-50 rounded-xl p-6 shadow-md animate-fadeInUp';
        questionDiv.style.animationDelay = `${index * 0.05}s`;
        
        const questionHeader = document.createElement('div');
        questionHeader.className = 'mb-4';
        
        const questionNumber = document.createElement('span');
        questionNumber.className = 'inline-block bg-teal-600 text-white px-4 py-2 rounded-lg font-bold ml-2';
        questionNumber.textContent = `السؤال ${index + 1}`;
        questionHeader.appendChild(questionNumber);
        
        const questionText = document.createElement('h3');
        questionText.className = 'text-xl font-semibold text-gray-800 mt-3';
        questionText.textContent = question.question_text;
        questionHeader.appendChild(questionText);
        
        questionDiv.appendChild(questionHeader);
        
        // True/False options
        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'space-y-3';
        
        const trueOption = createOption(question.id, 1, 'صح', index);
        const falseOption = createOption(question.id, 0, 'خطأ', index);
        
        optionsDiv.appendChild(trueOption);
        optionsDiv.appendChild(falseOption);
        
        questionDiv.appendChild(optionsDiv);
        container.appendChild(questionDiv);
    });
}

function createOption(questionId, value, label, questionIndex) {
    const optionDiv = document.createElement('label');
    optionDiv.className = 'flex items-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-teal-500 hover:bg-teal-50 transition-all';
    
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = `question-${questionId}`;
    radio.value = value;
    radio.className = 'ml-3 w-5 h-5 text-teal-600';
    radio.required = true;
    
    const labelText = document.createElement('span');
    labelText.className = 'text-lg font-semibold text-gray-700';
    labelText.textContent = label;
    
    optionDiv.appendChild(radio);
    optionDiv.appendChild(labelText);
    
    optionDiv.addEventListener('click', function() {
        const allOptions = document.querySelectorAll(`input[name="question-${questionId}"]`);
        allOptions.forEach(opt => {
            opt.parentElement.classList.remove('border-teal-600', 'bg-teal-100');
            opt.parentElement.classList.add('border-gray-300');
        });
        
        radio.checked = true;
        optionDiv.classList.remove('border-gray-300');
        optionDiv.classList.add('border-teal-600', 'bg-teal-100');
    });
    
    return optionDiv;
}

function startTimer() {
    updateTimerDisplay();
    
    timerInterval = setInterval(function() {
        timeLeft--;
        updateTimerDisplay();
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            submitExam();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('timerDisplay').textContent = display;
    
    if (timeLeft <= 60) {
        document.getElementById('timer').classList.add('text-red-600');
    }
}

document.getElementById('examForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Check if all questions are answered
    let allAnswered = true;
    questions.forEach(question => {
        const selected = document.querySelector(`input[name="question-${question.id}"]:checked`);
        if (!selected) {
            allAnswered = false;
        }
    });
    
    if (!allAnswered) {
        alert('يرجى الإجابة على جميع الأسئلة');
        return;
    }
    
    clearInterval(timerInterval);
    await submitExam();
});

async function submitExam() {
    const answers = [];
    
    questions.forEach(question => {
        const selected = document.querySelector(`input[name="question-${question.id}"]:checked`);
        answers.push({
            question_id: question.id,
            answer: selected ? parseInt(selected.value) : 0
        });
    });
    
    try {
        const response = await axios.post('/api/exam/submit', {
            worker_id: workerId,
            answers: answers
        });
        
        if (response.data.success) {
            window.location.href = `/result/${workerId}`;
        }
    } catch (error) {
        if (error.response && error.response.data) {
            alert(error.response.data.message);
        } else {
            alert('حدث خطأ في تقديم الاختبار');
        }
    }
}
