// Admin Questions Management
let questions = [];

document.addEventListener('DOMContentLoaded', async function() {
    await loadQuestions();
});

// Add new question
document.getElementById('addQuestionForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const question_text = document.getElementById('question_text').value.trim();
    const answer = document.querySelector('input[name="answer"]:checked').value;
    
    try {
        const response = await axios.post('/api/admin/questions', {
            question_text,
            is_correct_true: parseInt(answer)
        });
        
        if (response.data.success) {
            alert('تم إضافة السؤال بنجاح');
            document.getElementById('addQuestionForm').reset();
            await loadQuestions();
        }
    } catch (error) {
        alert('حدث خطأ في إضافة السؤال');
    }
});

// Load all questions
async function loadQuestions() {
    try {
        const response = await axios.get('/api/admin/questions');
        if (response.data.success) {
            questions = response.data.data;
            displayQuestions();
        }
    } catch (error) {
        console.error('Error loading questions:', error);
    }
}

function displayQuestions() {
    const container = document.getElementById('questionsContainer');
    container.innerHTML = '';
    
    if (questions.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-600">لا توجد أسئلة</p>';
        return;
    }
    
    questions.forEach((question, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'bg-gray-50 rounded-xl p-4 shadow-md';
        
        const header = document.createElement('div');
        header.className = 'flex justify-between items-start mb-2';
        
        const textDiv = document.createElement('div');
        textDiv.className = 'flex-1';
        
        const number = document.createElement('span');
        number.className = 'inline-block bg-teal-600 text-white px-3 py-1 rounded-lg font-bold ml-2';
        number.textContent = index + 1;
        
        const text = document.createElement('span');
        text.className = 'text-lg text-gray-800';
        text.textContent = question.question_text;
        
        textDiv.appendChild(number);
        textDiv.appendChild(text);
        
        const actions = document.createElement('div');
        actions.className = 'space-x-2 space-x-reverse';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.onclick = () => editQuestion(question);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.onclick = () => deleteQuestion(question.id);
        
        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);
        
        header.appendChild(textDiv);
        header.appendChild(actions);
        
        const answer = document.createElement('div');
        answer.className = 'mt-2';
        answer.innerHTML = `<span class="font-semibold">الإجابة الصحيحة:</span> 
            <span class="inline-block ${question.is_correct_true === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} px-3 py-1 rounded-lg">
                ${question.is_correct_true === 1 ? 'صح' : 'خطأ'}
            </span>`;
        
        questionDiv.appendChild(header);
        questionDiv.appendChild(answer);
        container.appendChild(questionDiv);
    });
}

function editQuestion(question) {
    const newText = prompt('تعديل نص السؤال:', question.question_text);
    if (!newText) return;
    
    const newAnswer = confirm('هل الإجابة الصحيحة: صح؟\nاضغط OK للموافقة أو Cancel لاختيار خطأ');
    
    updateQuestion(question.id, newText, newAnswer ? 1 : 0);
}

async function updateQuestion(id, question_text, is_correct_true) {
    try {
        const response = await axios.put(`/api/admin/questions/${id}`, {
            question_text,
            is_correct_true
        });
        
        if (response.data.success) {
            alert('تم تعديل السؤال بنجاح');
            await loadQuestions();
        }
    } catch (error) {
        alert('حدث خطأ في تعديل السؤال');
    }
}

async function deleteQuestion(id) {
    if (!confirm('هل أنت متأكد من حذف هذا السؤال؟')) return;
    
    try {
        const response = await axios.delete(`/api/admin/questions/${id}`);
        
        if (response.data.success) {
            alert('تم حذف السؤال بنجاح');
            await loadQuestions();
        }
    } catch (error) {
        alert('حدث خطأ في حذف السؤال');
    }
}
