// Worker Registration
document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const full_name = document.getElementById('full_name').value.trim();
    const employee_number = document.getElementById('employee_number').value.trim();
    const access_code = document.getElementById('access_code').value.trim();
    const messageDiv = document.getElementById('message');
    
    if (!full_name || !employee_number || !access_code) {
        showMessage('يرجى إدخال جميع البيانات', 'error');
        return;
    }
    
    try {
        const response = await axios.post('/api/workers/register', {
            full_name,
            employee_number,
            access_code
        });
        
        if (response.data.success) {
            showMessage('تم التسجيل بنجاح! جاري التحويل...', 'success');
            
            setTimeout(() => {
                window.location.href = `/videos/${response.data.worker_id}`;
            }, 2000);
        }
    } catch (error) {
        if (error.response && error.response.data) {
            showMessage(error.response.data.message, 'error');
        } else {
            showMessage('حدث خطأ في التسجيل. يرجى المحاولة مرة أخرى', 'error');
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
