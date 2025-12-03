// Admin Access Codes Management
let codes = [];

document.addEventListener('DOMContentLoaded', async function() {
    await loadCodes();
});

// Add new access code
document.getElementById('addCodeForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const full_name = document.getElementById('full_name').value.trim();
    const employee_number = document.getElementById('employee_number').value.trim();
    const job_title = document.getElementById('job_title').value.trim();
    const code = document.getElementById('code').value.trim();
    
    try {
        const response = await axios.post('/api/admin/access-codes', {
            full_name,
            employee_number,
            job_title,
            code
        });
        
        if (response.data.success) {
            alert('تم إضافة الرقم السري بنجاح');
            document.getElementById('addCodeForm').reset();
            await loadCodes();
        }
    } catch (error) {
        alert('حدث خطأ في إضافة الرقم السري');
    }
});

// Load all access codes
async function loadCodes() {
    try {
        const response = await axios.get('/api/admin/access-codes');
        if (response.data.success) {
            codes = response.data.data;
            displayCodes();
        }
    } catch (error) {
        console.error('Error loading codes:', error);
    }
}

function displayCodes() {
    const tbody = document.getElementById('codesTableBody');
    tbody.innerHTML = '';
    
    if (codes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-gray-600">لا توجد أرقام سرية</td></tr>';
        return;
    }
    
    codes.forEach(code => {
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50';
        
        row.innerHTML = `
            <td class="px-4 py-3">${code.full_name}</td>
            <td class="px-4 py-3">${code.employee_number}</td>
            <td class="px-4 py-3">${code.job_title}</td>
            <td class="px-4 py-3">
                <span class="font-mono bg-gray-200 px-3 py-1 rounded">${code.code}</span>
            </td>
            <td class="px-4 py-3">
                ${code.used === 1 
                    ? '<span class="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">مستخدم</span>' 
                    : '<span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">متاح</span>'
                }
            </td>
            <td class="px-4 py-3 text-center">
                <button onclick="deleteCode(${code.id})" 
                        class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

async function deleteCode(id) {
    if (!confirm('هل أنت متأكد من حذف هذا الرقم السري؟')) return;
    
    try {
        const response = await axios.delete(`/api/admin/access-codes/${id}`);
        
        if (response.data.success) {
            alert('تم حذف الرقم السري بنجاح');
            await loadCodes();
        }
    } catch (error) {
        alert('حدث خطأ في حذف الرقم السري');
    }
}
