document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    const links = document.querySelectorAll('.sidebar-category a');
    const sections = document.querySelectorAll('.page-content');

    // Mobile menu toggle
    mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        if (sidebar.classList.contains('open')) {
            document.body.style.overflow = 'hidden';
            mobileMenuBtn.innerHTML = '✕';
        } else {
            document.body.style.overflow = '';
            mobileMenuBtn.innerHTML = '☰';
        }
    });

    // Close sidebar on link click (mobile)
    links.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('open');
                document.body.style.overflow = '';
                mobileMenuBtn.innerHTML = '☰';
            }
        });
    });

    // Handle routing
    function handleRoute() {
        let hash = window.location.hash;
        if (!hash) {
            // Default to first link if no hash
            if (links.length > 0) {
                hash = links[0].getAttribute('href');
                window.location.hash = hash;
                return; // Will trigger hashchange again
            }
        }

        const targetId = hash.substring(1); // Remove the '#'

        // Hide all sections, show target
        sections.forEach(section => {
            if (section.id === targetId) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });

        // Update active link state
        links.forEach(link => {
            if (link.getAttribute('href') === hash) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
        
        // Scroll to top on route change
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Listen for hash changes
    window.addEventListener('hashchange', handleRoute);

    // Initial route handling
    handleRoute();

    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            // Re-initialize mermaid if dark mode changed
            if (window.renderMermaid) {
                window.renderMermaid();
            }
        });
    }
});
