// Admin login
document.getElementById('adminLoginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const messageDiv = document.getElementById('message');
    
    if (!username || !password) {
        showMessage('يرجى إدخال اسم المستخدم وكلمة المرور', 'error');
        return;
    }
    
    try {
        const response = await axios.post('/api/admin/login', {
            username,
            password
        });
        
        if (response.data.success) {
            showMessage('تم تسجيل الدخول بنجاح! جاري التحويل...', 'success');
            
            setTimeout(() => {
                window.location.href = '/admin/dashboard';
            }, 1500);
        }
    } catch (error) {
        if (error.response && error.response.data) {
            showMessage(error.response.data.message, 'error');
        } else {
            showMessage('حدث خطأ في تسجيل الدخول', 'error');
        }
    }
});

function showMessage(message, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.className = 'p-4 rounded-lg text-center font-semibold ';
    
    if (type === 'success') {
        messageDiv.className += 'bg-green-100 text-green-800 border-2 border-green-400';
    } else {
        messageDiv.className += 'bg-red-100 text-red-800 border-2 border-red-400';
    }
    
    messageDiv.classList.remove('hidden');
}
