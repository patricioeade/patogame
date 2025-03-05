document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    const MASTER_PASSWORD = 'pato123';

    // Check if already authenticated
    if (sessionStorage.getItem('authenticated') === 'true') {
        // Redirect to the page they were trying to access or default to index
        const redirectTo = sessionStorage.getItem('redirectUrl') || '/';
        window.location.href = redirectTo;
    }

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const password = document.getElementById('password').value;
        
        if (password === MASTER_PASSWORD) {
            // Set authentication in session storage
            sessionStorage.setItem('authenticated', 'true');
            
            // Redirect to the page they were trying to access or default to index
            const redirectTo = sessionStorage.getItem('redirectUrl') || '/';
            window.location.href = redirectTo;
        } else {
            // Show error message
            errorMessage.classList.remove('d-none');
            // Clear password field
            document.getElementById('password').value = '';
        }
    });
});