// Admin Results Management
let results = [];

document.addEventListener('DOMContentLoaded', async function() {
    await loadResults();
});

// Load all exam results
async function loadResults() {
    try {
        const response = await axios.get('/api/admin/results');
        if (response.data.success) {
            results = response.data.data;
            displayResults();
        }
    } catch (error) {
        console.error('Error loading results:', error);
    }
}

function displayResults() {
    const tbody = document.getElementById('resultsTableBody');
    tbody.innerHTML = '';
    
    if (results.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-gray-600">لا توجد نتائج</td></tr>';
        return;
    }
    
    results.forEach(result => {
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50';
        
        const passed = result.passed === 1;
        const date = new Date(result.exam_date).toLocaleDateString('ar-EG');
        
        row.innerHTML = `
            <td class="px-4 py-3">${result.full_name}</td>
            <td class="px-4 py-3">${result.employee_number}</td>
            <td class="px-4 py-3">${result.score}/20</td>
            <td class="px-4 py-3">${result.percentage.toFixed(0)}%</td>
            <td class="px-4 py-3">
                ${passed 
                    ? '<span class="bg-green-100 text-green-800 px-3 py-1 rounded-full font-bold">ناجح</span>' 
                    : '<span class="bg-red-100 text-red-800 px-3 py-1 rounded-full font-bold">راسب</span>'
                }
            </td>
            <td class="px-4 py-3">${date}</td>
            <td class="px-4 py-3 text-center space-x-2 space-x-reverse">
                ${result.can_retake_exam === 0 
                    ? `<button onclick="allowRetake(${result.worker_id})" 
                              class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm">
                          <i class="fas fa-redo ml-1"></i>السماح بإعادة الاختبار
                       </button>`
                    : '<span class="text-green-600 font-semibold">مسموح بإعادة الاختبار</span>'
                }
                <button onclick="deleteWorker(${result.worker_id})" 
                        class="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm">
                    <i class="fas fa-trash ml-1"></i>حذف
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

async function allowRetake(workerId) {
    if (!confirm('هل تريد السماح لهذا العامل بإعادة الاختبار؟')) return;
    
    try {
        const response = await axios.put(`/api/admin/workers/${workerId}/allow-retake`);
        
        if (response.data.success) {
            alert('تم السماح بإعادة الاختبار بنجاح');
            await loadResults();
        }
    } catch (error) {
        alert('حدث خطأ في العملية');
    }
}

async function deleteWorker(workerId) {
    if (!confirm('هل أنت متأكد من حذف هذا العامل؟ سيتم حذف جميع بياناته ونتائجه.')) return;
    
    try {
        const response = await axios.delete(`/api/admin/workers/${workerId}`);
        
        if (response.data.success) {
            alert('تم حذف العامل بنجاح');
            await loadResults();
        }
    } catch (error) {
        alert('حدث خطأ في الحذف');
    }
}

// Export to Excel
function exportToExcel() {
    if (results.length === 0) {
        alert('لا توجد بيانات للتصدير');
        return;
    }
    
    // Prepare data for Excel
    const excelData = results.map(result => ({
        'الاسم': result.full_name,
        'الرقم الوظيفي': result.employee_number,
        'الدرجة': `${result.score}/20`,
        'النسبة المئوية': `${result.percentage.toFixed(0)}%`,
        'النتيجة': result.passed === 1 ? 'ناجح' : 'راسب',
        'تاريخ الاختبار': new Date(result.exam_date).toLocaleDateString('ar-EG')
    }));
    
    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // Set column widths
    ws['!cols'] = [
        { wch: 25 }, // Name
        { wch: 15 }, // Employee number
        { wch: 10 }, // Score
        { wch: 15 }, // Percentage
        { wch: 10 }, // Result
        { wch: 15 }  // Date
    ];
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'نتائج الاختبارات');
    
    // Generate filename with current date
    const filename = `نتائج_الاختبارات_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Save file
    XLSX.writeFile(wb, filename);
}
