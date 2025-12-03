// Admin dashboard
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin Dashboard Loaded');
    
    // Add hover effects to dashboard cards
    const cards = document.querySelectorAll('.dashboard-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.05)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
});
