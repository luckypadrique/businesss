import {
    collection,
    doc,
    setDoc,
    deleteDoc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

(function () {
    'use strict';

    // ==========================================
    // 1. DATA STORE & INITIAL SEED DATA
    // ==========================================

    const DEFAULT_PROFILE = {
        name: 'Acme Corporation',
        ownerName: 'Lucky Gonzales',
        email: 'luckyjgonzales09@gmail.com',
        contactNumber: '+1 (555) 019-2834',
        address: '123 Enterprise Way, Suite 400, Tech City, CA 94016'
    };

    const DEFAULT_JOBS = [
        {
            id: 'job-1',
            title: 'Pattern Maker',
            description: 'Creates and adjusts clothing patterns based on garment designs and measurements.',
            location: 'Philippines',
            salary: '₱25,000–₱35,000/month',
            employmentType: 'Full-time',
            requirements: '2–5 years experience',
            status: 'Active',
            datePosted: '2026-09-21'
        },
        {
            id: 'job-2',
            title: 'Sewing Machine Operator',
            description: 'Operates industrial sewing machines and assembles garments.',
            location: 'Philippines',
            salary: '₱18,000–₱25,000/month',
            employmentType: 'Full-time',
            requirements: '2–5 years experience',
            status: 'Active',
            datePosted: '2026-09-21'
        },
        {
            id: 'job-3',
            title: 'Cutting Machine Operator',
            description: 'Cuts fabric accurately according to patterns.',
            location: 'Philippines',
            salary: '₱20,000–₱28,000/month',
            employmentType: 'Full-time',
            requirements: '2–5 years experience',
            status: 'Active',
            datePosted: '2026-09-21'
        },
        {
            id: 'job-4',
            title: 'Quality Control Inspector',
            description: 'Checks garments for defects and stitching problems.',
            location: 'Philippines',
            salary: '₱22,000–₱30,000/month',
            employmentType: 'Full-time',
            requirements: '2–5 years experience',
            status: 'Active',
            datePosted: '2026-09-21'
        },
        {
            id: 'job-5',
            title: 'Production Supervisor',
            description: 'Supervises production workers and monitors daily output.',
            location: 'Philippines',
            salary: '₱30,000–₱45,000/month',
            employmentType: 'Full-time',
            requirements: '3–7 years experience',
            status: 'Active',
            datePosted: '2026-09-21'
        }
    ];

    const DB = {
        init() {
            if (!localStorage.getItem('biz_profile')) {
                localStorage.setItem('biz_profile', JSON.stringify(DEFAULT_PROFILE));
            }
            if (!localStorage.getItem('biz_jobs')) {
                localStorage.setItem('biz_jobs', JSON.stringify(DEFAULT_JOBS));
            }
            if (!localStorage.getItem('biz_applicants')) {
                localStorage.setItem('biz_applicants', JSON.stringify([]));
            }
            if (!localStorage.getItem('biz_applicant_accounts')) {
                localStorage.setItem('biz_applicant_accounts', JSON.stringify([]));
            }
            if (!localStorage.getItem('biz_auth')) {
                localStorage.setItem('biz_auth', JSON.stringify({ isLoggedIn: false, currentUser: null, role: 'owner' }));
            }
        },
        getProfile() {
            const saved = localStorage.getItem('biz_profile');
            return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
        },
        saveProfile(profile) {
            localStorage.setItem('biz_profile', JSON.stringify(profile));
        },
        getJobs() {
            return JSON.parse(localStorage.getItem('biz_jobs')) || DEFAULT_JOBS;
        },
        saveJobs(jobs) {
            localStorage.setItem('biz_jobs', JSON.stringify(jobs));
        },
        getApplicants() {
            return JSON.parse(localStorage.getItem('biz_applicants')) || [];
        },
        saveApplicants(applicants) {
            localStorage.setItem('biz_applicants', JSON.stringify(applicants));
        },
        getApplicantAccounts() {
            return JSON.parse(localStorage.getItem('biz_applicant_accounts')) || [];
        },
        saveApplicantAccounts(accounts) {
            localStorage.setItem('biz_applicant_accounts', JSON.stringify(accounts));
        },
        getAuth() {
            return JSON.parse(localStorage.getItem('biz_auth')) || { isLoggedIn: false, currentUser: null, role: 'owner' };
        },
        saveAuth(auth) {
            localStorage.setItem('biz_auth', JSON.stringify(auth));
        }
    };

    DB.init();

    // ==========================================
    // 2. REAL-TIME FIREBASE SYNC
    // ==========================================
    function listenToDataRealtime() {
        try {
            if (!window.firebaseDB) return;

            onSnapshot(collection(window.firebaseDB, 'jobs'), (snapshot) => {
                const cloudJobs = [];
                snapshot.forEach((item) => cloudJobs.push(item.data()));
                if (cloudJobs.length > 0) {
                    DB.saveJobs(cloudJobs);
                    jobs = cloudJobs;
                    if (typeof renderJobList === 'function') renderJobList();
                    if (typeof renderDashboard === 'function') renderDashboard();
                }
            });

            onSnapshot(collection(window.firebaseDB, 'applicants'), (snapshot) => {
                const cloudApplicants = [];
                snapshot.forEach((item) => cloudApplicants.push(item.data()));
                localStorage.setItem('biz_applicants', JSON.stringify(cloudApplicants));
                applicants = DB.getApplicants();

                if (typeof renderDashboard === 'function') renderDashboard();
                if (typeof renderApplicants === 'function') renderApplicants();
            });

            onSnapshot(collection(window.firebaseDB, 'applicantAccounts'), (snapshot) => {
                const cloudAccounts = [];
                snapshot.forEach((item) => cloudAccounts.push(item.data()));
                localStorage.setItem('biz_applicant_accounts', JSON.stringify(cloudAccounts));
            });

            onSnapshot(collection(window.firebaseDB, 'businessProfile'), (snapshot) => {
                snapshot.forEach((docItem) => {
                    if (docItem.id === 'main_profile') {
                        const cloudProfile = docItem.data();
                        DB.saveProfile(cloudProfile);
                        profile = cloudProfile;
                        updateBizHeaderInfo();
                    }
                });
            });
        } catch (error) {
            console.error('Firebase sync error:', error);
        }
    }

    listenToDataRealtime();

    async function saveJobToFirebase(jobObj) {
        if (!window.firebaseDB || !jobObj.id) return;
        await setDoc(doc(window.firebaseDB, 'jobs', jobObj.id), jobObj);
    }

    async function deleteJobFromFirebase(jobId) {
        if (!window.firebaseDB || !jobId) return;
        await deleteDoc(doc(window.firebaseDB, 'jobs', jobId));
    }

    async function saveProfileToFirebase(profileObj) {
        if (!window.firebaseDB) return;
        await setDoc(doc(window.firebaseDB, 'businessProfile', 'main_profile'), profileObj);
    }

    async function saveApplicantToFirebase(applicantObj, accountObj) {
        if (!window.firebaseDB) return;
        if (applicantObj && applicantObj.id) {
            await setDoc(doc(window.firebaseDB, 'applicants', applicantObj.id), applicantObj);
        }
        if (accountObj && accountObj.id) {
            await setDoc(doc(window.firebaseDB, 'applicantAccounts', accountObj.id), accountObj);
        }
    }

    async function deleteApplicantFromFirebase(applicantId) {
        if (!window.firebaseDB || !applicantId) return;
        await deleteDoc(doc(window.firebaseDB, 'applicants', applicantId));
    }

    // ==========================================
    // 3. STATE VARIABLES & UI REFERENCES
    // ==========================================
    let authState = DB.getAuth();
    let jobs = DB.getJobs();
    let applicants = DB.getApplicants();
    let profile = DB.getProfile();
    let activeView = 'dashboard';

    const el = {
        loginView: document.getElementById('view-login'),
        dashboardContainer: document.getElementById('dashboard-container'),
        viewDashboard: document.getElementById('view-dashboard'),
        viewJobList: document.getElementById('view-job-list'),
        viewApplicants: document.getElementById('view-applicants'),
        viewProfile: document.getElementById('view-profile'),
        viewTitle: document.getElementById('view-title'),

        navItems: document.querySelectorAll('.nav-item'),
        sidebar: document.getElementById('app-sidebar'),
        sidebarBackdrop: document.getElementById('sidebar-backdrop'),
        btnSidebarToggle: document.getElementById('btn-sidebar-toggle'),
        sidebarProfileName: document.getElementById('sidebar-profile-name'),
        sidebarAvatarInitials: document.getElementById('sidebar-avatar-initials'),
        headerBusinessName: document.getElementById('header-business-name'),
        headerOwnerName: document.getElementById('header-owner-name'),

        loginForm: document.getElementById('login-form'),
        loginEmail: document.getElementById('login-email'),
        loginPassword: document.getElementById('login-password'),
        loginErrorContainer: document.getElementById('login-error-container'),

        metricTotalJobs: document.getElementById('metric-total-jobs'),
        metricActiveJobs: document.getElementById('metric-active-jobs'),
        metricCompletedJobs: document.getElementById('metric-completed-jobs'),
        metricTotalApplicants: document.getElementById('metric-total-applicants'),
        dashboardApplicantsList: document.getElementById('dashboard-applicants-list'),

        jobsGrid: document.getElementById('jobs-grid-container'),
        btnPostJobTrigger: document.getElementById('btn-post-job-trigger'),
        modalJobFormBackdrop: document.getElementById('modal-job-form-backdrop'),
        jobForm: document.getElementById('job-form'),
        btnCloseJobModal: document.getElementById('btn-close-job-modal'),
        btnCancelJobModal: document.getElementById('btn-cancel-job-modal'),

        applicantsList: document.getElementById('applicants-list'),

        profileForm: document.getElementById('profile-form'),
        profileBizName: document.getElementById('profile-biz-name'),
        profileOwnerName: document.getElementById('profile-owner-name'),
        profileEmail: document.getElementById('profile-email'),
        profilePhone: document.getElementById('profile-phone'),
        profileAddress: document.getElementById('profile-address'),

        toastContainer: document.getElementById('toast-container')
    };

    function showToast(message, type = 'success') {
        if (!el.toastContainer) return;
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        const icon = type === 'success' 
            ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
            : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';

        toast.innerHTML = `${icon}<span>${escapeHTML(message)}</span>`;
        el.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s reverse forwards';
            toast.addEventListener('animationend', () => toast.remove());
        }, 3000);
    }

    function escapeHTML(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    function getInitials(name) {
        if (!name) return 'OB';
        return name.split(' ').map(part => part.charAt(0)).slice(0, 2).join('').toUpperCase();
    }

    function formatDate(dateStr) {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    }

    function populateRegisterJobDropdown() {
        const select = document.getElementById('register-job-position');
        if (!select) return;
        const currentJobs = DB.getJobs().filter(j => j.status === 'Active');
        if (currentJobs.length > 0) {
            select.innerHTML = currentJobs.map(j =>
                `<option value="${j.id}" data-title="${escapeHTML(j.title)}">${escapeHTML(j.title)}</option>`
            ).join('');
        }
    }

    if (el.btnSidebarToggle) {
        el.btnSidebarToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (el.sidebar) el.sidebar.classList.toggle('mobile-open');
            if (el.sidebarBackdrop) el.sidebarBackdrop.classList.toggle('show');
        });
    }

    if (el.sidebarBackdrop) {
        el.sidebarBackdrop.addEventListener('click', () => {
            if (el.sidebar) el.sidebar.classList.remove('mobile-open');
            if (el.sidebarBackdrop) el.sidebarBackdrop.classList.remove('show');
        });
    }

    window.showBusinessLogin = function () {
        document.getElementById('card-business-login').style.display = 'block';
        document.getElementById('card-applicant-login').style.display = 'none';
        document.getElementById('card-applicant-register').style.display = 'none';
    };

    window.showApplicantLogin = function (prefillEmail = '') {
        document.getElementById('card-business-login').style.display = 'none';
        document.getElementById('card-applicant-login').style.display = 'block';
        document.getElementById('card-applicant-register').style.display = 'none';
        if (prefillEmail) {
            const emailInput = document.getElementById('applicant-login-email');
            if (emailInput) emailInput.value = prefillEmail;
        }
    };

    window.showApplicantRegister = function () {
        document.getElementById('card-business-login').style.display = 'none';
        document.getElementById('card-applicant-login').style.display = 'none';
        document.getElementById('card-applicant-register').style.display = 'block';
        populateRegisterJobDropdown();
    };

    // REGISTER APPLICANT HANDLER
const registerForm = document.getElementById('applicant-register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fullName = document.getElementById('register-fullname')?.value.trim();
        const email = document.getElementById('register-email')?.value.trim();
        const password = document.getElementById('register-password')?.value;
        const confirmPassword = document.getElementById('register-confirm-password')?.value;
        const contact = document.getElementById('register-contact')?.value.trim() || '';
        const address = document.getElementById('register-address')?.value.trim() || '';
        const summary = document.getElementById('register-summary')?.value.trim() || '';
        const yearsExp = document.getElementById('register-years-experience')?.value || '0';

        if (!fullName || !email || !password || password !== confirmPassword) {
            showToast('Please correct the errors before registering.', 'error');
            return;
        }

        const jobSelect = document.getElementById('register-job-position');
        let selectedJobId = 'job-1';
        let selectedJobTitle = 'Pattern Maker';

        if (jobSelect && jobSelect.options.length > 0) {
            const opt = jobSelect.options[jobSelect.selectedIndex];
            selectedJobId = opt.value;
            selectedJobTitle = opt.getAttribute('data-title') || opt.text;
        }

        const timestamp = Date.now();
        const newApplicant = {
            id: 'app-' + timestamp,
            name: fullName,
            email: email,
            jobId: selectedJobId,
            jobTitle: selectedJobTitle,
            dateApplied: new Date().toISOString().split('T')[0],
            status: 'Pending',
            timestamp: timestamp
        };

        const newAccount = {
            id: 'app-user-' + timestamp,
            fullName,
            email,
            plainPassword: password,
            contactNumber: contact,
            address: address,
            professionalSummary: summary,
            yearsOfExperience: parseInt(yearsExp) || 0,
            createdAt: new Date().toISOString().split('T')[0]
        };

        // Local Storage Save
        const currentApplicants = DB.getApplicants();
        currentApplicants.unshift(newApplicant);
        DB.saveApplicants(currentApplicants);

        const currentAccounts = DB.getApplicantAccounts();
        currentAccounts.push(newAccount);
        DB.saveApplicantAccounts(currentAccounts);

        // DIREKTANG SAVE SA FIREBASE CLOUD
        try {
            await saveApplicantToFirebase(newApplicant, newAccount);
            showToast('✓ Done Registering! Account created.', 'success');
        } catch (err) {
            console.error("Firebase Save Error:", err);
            showToast('Saved locally, but Firebase sync failed.', 'error');
        }

        setTimeout(() => {
            window.showApplicantLogin(email);
        }, 1200);
    });
}

    // APPLICANT LOGIN HANDLER
    const applicantLoginForm = document.getElementById('applicant-login-form');
    if (applicantLoginForm) {
        applicantLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const email = document.getElementById('applicant-login-email')?.value.trim();
            const password = document.getElementById('applicant-login-password')?.value;

            const accounts = DB.getApplicantAccounts();
            const account = accounts.find(acc => acc.email.toLowerCase() === email.toLowerCase() && acc.plainPassword === password);

            if (account) {
                authState = {
                    isLoggedIn: true,
                    currentUser: account.email,
                    role: 'applicant',
                    name: account.fullName
                };
                DB.saveAuth(authState);
                showToast(`Welcome back, ${account.fullName}!`);
                checkAuthentication();
            } else {
                showToast('Invalid email or password.', 'error');
            }
        });
    }

    function switchView(viewName) {
        if (viewName === 'logout') {
            handleLogout();
            return;
        }

        activeView = viewName;
        document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));

        let displayTitle = 'Dashboard';
        if (viewName === 'dashboard' && authState.role !== 'applicant') {
            renderDashboard();
            if (el.viewDashboard) el.viewDashboard.classList.add('active');
            displayTitle = 'Dashboard Analytics';
        } else if (viewName === 'job-list' && authState.role !== 'applicant') {
            renderJobList();
            if (el.viewJobList) el.viewJobList.classList.add('active');
            displayTitle = 'Job Openings';
        } else if (viewName === 'applicants' && authState.role !== 'applicant') {
            renderApplicants();
            if (el.viewApplicants) el.viewApplicants.classList.add('active');
            displayTitle = 'Applicant Management';
        } else if (viewName === 'profile' && authState.role !== 'applicant') {
            populateProfileForm();
            if (el.viewProfile) el.viewProfile.classList.add('active');
            displayTitle = 'Business Profile';
        } else if (viewName === 'my-resume' || authState.role === 'applicant') {
            const viewMyResume = document.getElementById('view-my-resume');
            if (viewMyResume) {
                renderMyResumeView();
                viewMyResume.classList.add('active');
                displayTitle = 'My Resume & Profile';
            }
        }

        if (el.viewTitle) el.viewTitle.textContent = displayTitle;

        el.navItems.forEach(item => {
            if (item.getAttribute('data-target') === viewName) item.classList.add('active');
            else item.classList.remove('active');
        });

        if (el.sidebar) el.sidebar.classList.remove('mobile-open');
        if (el.sidebarBackdrop) el.sidebarBackdrop.classList.remove('show');
    }

    el.navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            switchView(item.getAttribute('data-target'));
        });
    });

    document.querySelectorAll('[data-nav]').forEach(button => {
        button.addEventListener('click', () => {
            switchView(button.getAttribute('data-nav'));
        });
    });

    // ROLE CONTROL & SIDEBAR LABEL FIX
    function checkAuthentication() {
        if (authState.isLoggedIn) {
            if (el.loginView) el.loginView.style.display = 'none';
            if (el.dashboardContainer) el.dashboardContainer.style.display = 'flex';

            const navDashboard = document.querySelector('.nav-item[data-target="dashboard"]');
            const navJobList = document.querySelector('.nav-item[data-target="job-list"]');
            const navApplicants = document.querySelector('.nav-item[data-target="applicants"]');
            const navBizProfile = document.getElementById('nav-biz-profile') || document.querySelector('.nav-item[data-target="profile"]');
            const navMyResume = document.getElementById('nav-my-resume');

            if (authState.role === 'applicant') {
                // Itago ang Owner Menu Items
                if (navDashboard) navDashboard.style.display = 'none';
                if (navJobList) navJobList.style.display = 'none';
                if (navApplicants) navApplicants.style.display = 'none';
                if (navBizProfile) navBizProfile.style.display = 'none';
                
                // Ipakita ang Applicant Menu Item
                if (navMyResume) navMyResume.style.display = 'flex';
                activeView = 'my-resume';
            } else {
                // Ipakita ang Owner Menu Items
                if (navDashboard) navDashboard.style.display = 'flex';
                if (navJobList) navJobList.style.display = 'flex';
                if (navApplicants) navApplicants.style.display = 'flex';
                if (navBizProfile) navBizProfile.style.display = 'flex';
                
                // Itago ang Applicant Menu
                if (navMyResume) navMyResume.style.display = 'none';
                activeView = 'dashboard';
            }

            updateBizHeaderInfo();
            switchView(activeView);
        } else {
            if (el.dashboardContainer) el.dashboardContainer.style.display = 'none';
            if (el.loginView) {
                el.loginView.style.display = 'flex';
                el.loginView.classList.add('active');
            }
        }
    }

    function handleLogin(email, password) {
        const savedOwnerPassword = 'Lucky12345';
        if ((email === 'luckyjgonzales09@gmail.com' || email === 'owner@demo.com') && password === savedOwnerPassword) {
            authState = { isLoggedIn: true, currentUser: email, role: 'owner' };
            DB.saveAuth(authState);
            showToast('Logged in successfully!');
            checkAuthentication();
        } else {
            if (el.loginErrorContainer) el.loginErrorContainer.style.display = 'flex';
        }
    }

    function handleLogout() {
        authState = { isLoggedIn: false, currentUser: null, role: null };
        DB.saveAuth(authState);
        showToast('Logged out successfully.');
        checkAuthentication();
    }

    if (el.loginForm) {
        el.loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleLogin(el.loginEmail.value.trim(), el.loginPassword.value);
        });
    }

    // UPDATE SIDEBAR LABELS (JOB APPLICANT VS BUSINESS OWNER)
    function updateBizHeaderInfo() {
        const roleLabelEl = document.querySelector('.profile-role');

        if (authState.role === 'applicant') {
            const applicantName = authState.name || 'Applicant';
            if (el.sidebarProfileName) el.sidebarProfileName.textContent = applicantName;
            if (el.sidebarAvatarInitials) el.sidebarAvatarInitials.textContent = getInitials(applicantName);
            if (el.headerBusinessName) el.headerBusinessName.textContent = 'Applicant Portal';
            if (el.headerOwnerName) el.headerOwnerName.textContent = applicantName;
            
            // Palitan ang teksto sa ilalim ng sidebar avatar
            if (roleLabelEl) roleLabelEl.textContent = 'Job Applicant';
        } else {
            profile = DB.getProfile();
            if (el.sidebarProfileName) el.sidebarProfileName.textContent = profile.ownerName || 'Owner';
            if (el.sidebarAvatarInitials) el.sidebarAvatarInitials.textContent = getInitials(profile.ownerName);
            if (el.headerBusinessName) el.headerBusinessName.textContent = profile.name || 'Business';
            if (el.headerOwnerName) el.headerOwnerName.textContent = profile.ownerName || 'Owner';
            
            if (roleLabelEl) roleLabelEl.textContent = 'Business Owner';
        }
    }

    if (el.profileForm) {
        el.profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const updatedProfile = {
                name: el.profileBizName.value.trim(),
                ownerName: el.profileOwnerName.value.trim(),
                email: el.profileEmail.value.trim(),
                contactNumber: el.profilePhone.value.trim(),
                address: el.profileAddress.value.trim()
            };

            DB.saveProfile(updatedProfile);
            profile = updatedProfile;

            await saveProfileToFirebase(updatedProfile);

            updateBizHeaderInfo();
            showToast('✓ Profile Changes Saved Successfully!', 'success');
        });
    }

    function populateProfileForm() {
        profile = DB.getProfile();
        if (el.profileBizName) el.profileBizName.value = profile.name || '';
        if (el.profileOwnerName) el.profileOwnerName.value = profile.ownerName || '';
        if (el.profileEmail) el.profileEmail.value = profile.email || '';
        if (el.profilePhone) el.profilePhone.value = profile.contactNumber || '';
        if (el.profileAddress) el.profileAddress.value = profile.address || '';
    }

    function renderDashboard() {
        jobs = DB.getJobs();
        applicants = DB.getApplicants();

        if (el.metricTotalJobs) el.metricTotalJobs.textContent = jobs.length;
        if (el.metricActiveJobs) el.metricActiveJobs.textContent = jobs.filter(j => j.status === 'Active').length;
        if (el.metricCompletedJobs) el.metricCompletedJobs.textContent = jobs.filter(j => j.status === 'Completed').length;
        if (el.metricTotalApplicants) el.metricTotalApplicants.textContent = applicants.length;

        if (el.dashboardApplicantsList) {
            if (applicants.length === 0) {
                el.dashboardApplicantsList.innerHTML = `<tr><td colspan="4" style="text-align:center;">No applicants yet.</td></tr>`;
            } else {
                el.dashboardApplicantsList.innerHTML = applicants.slice(0, 5).map(app => `
                    <tr>
                        <td style="font-weight:600;">${escapeHTML(app.name)}</td>
                        <td>${escapeHTML(app.jobTitle)}</td>
                        <td>${formatDate(app.dateApplied)}</td>
                        <td><span class="badge ${app.status === 'Accepted' ? 'badge-success' : (app.status === 'Rejected' ? 'badge-danger' : 'badge-warning')}">${app.status}</span></td>
                    </tr>
                `).join('');
            }
        }
    }

    function renderJobList() {
        jobs = DB.getJobs();
        if (!el.jobsGrid) return;

        el.jobsGrid.innerHTML = jobs.map(job => `
            <div class="job-card">
                <h4>${escapeHTML(job.title)}</h4>
                <p>${escapeHTML(job.location)} - ${escapeHTML(job.salary)}</p>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.5rem;">
                    <span class="badge badge-success">${job.status}</span>
                    <button class="btn btn-danger btn-sm btn-delete-job" data-id="${job.id}" style="padding:0.2rem 0.5rem; font-size:0.75rem;">Delete Job</button>
                </div>
            </div>
        `).join('');

        document.querySelectorAll('.btn-delete-job').forEach(btn => {
            btn.addEventListener('click', async () => {
                const jobId = btn.getAttribute('data-id');
                if (confirm('Are you sure you want to delete this job opening?')) {
                    jobs = jobs.filter(j => j.id !== jobId);
                    DB.saveJobs(jobs);
                    await deleteJobFromFirebase(jobId);
                    showToast('Job listing deleted!');
                    renderJobList();
                    renderDashboard();
                }
            });
        });
    }

    function renderApplicants() {
        applicants = DB.getApplicants();
        if (!el.applicantsList) return;

        if (applicants.length === 0) {
            el.applicantsList.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem;">No applicants found.</td></tr>`;
            return;
        }

        el.applicantsList.innerHTML = applicants.map(app => `
            <tr>
                <td style="font-weight: 600;">${escapeHTML(app.name)} <br><small style="color:gray;">${escapeHTML(app.email)}</small></td>
                <td>${escapeHTML(app.jobTitle)}</td>
                <td>${formatDate(app.dateApplied)}</td>
                <td>
                    <button class="btn btn-secondary btn-sm btn-view-applicant-profile" data-id="${app.id}" data-email="${escapeHTML(app.email)}">
                        View Profile
                    </button>
                </td>
                <td>
                    <select class="status-select ${app.status.toLowerCase()}" data-id="${app.id}">
                        <option value="Pending" ${app.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Accepted" ${app.status === 'Accepted' ? 'selected' : ''}>Approve / Accept</option>
                        <option value="Rejected" ${app.status === 'Rejected' ? 'selected' : ''}>Reject</option>
                    </select>
                </td>
                <td>
                    <button class="btn btn-danger btn-sm btn-delete-applicant" data-id="${app.id}" style="padding: 0.35rem 0.65rem; font-size: 0.8rem;">
                        Delete
                    </button>
                </td>
            </tr>
        `).join('');

        document.querySelectorAll('.btn-view-applicant-profile').forEach(btn => {
            btn.addEventListener('click', () => {
                const appEmail = btn.getAttribute('data-email');
                openApplicantProfileModal(appEmail);
            });
        });

        document.querySelectorAll('.status-select').forEach(select => {
            select.addEventListener('change', async (e) => {
                const applicantId = select.getAttribute('data-id');
                const newStatus = e.target.value;

                applicants = applicants.map(a => {
                    if (a.id === applicantId) return { ...a, status: newStatus };
                    return a;
                });

                DB.saveApplicants(applicants);

                const targetApp = applicants.find(a => a.id === applicantId);
                if (targetApp) {
                    await saveApplicantToFirebase(targetApp, null);
                }

                showToast(`Applicant status updated to: ${newStatus}`);
                renderApplicants();
                renderDashboard();
            });
        });

        document.querySelectorAll('.btn-delete-applicant').forEach(btn => {
            btn.addEventListener('click', async () => {
                const applicantId = btn.getAttribute('data-id');
                if (confirm('Are you sure you want to delete this applicant?')) {
                    applicants = applicants.filter(a => a.id !== applicantId);
                    DB.saveApplicants(applicants);
                    await deleteApplicantFromFirebase(applicantId);

                    showToast('Applicant deleted!');
                    renderApplicants();
                    renderDashboard();
                }
            });
        });
    }

    function openApplicantProfileModal(email) {
        const modalBackdrop = document.getElementById('modal-applicant-profile-backdrop');
        const modalName = document.getElementById('modal-applicant-name');
        const modalJob = document.getElementById('modal-applicant-job');
        const modalBody = document.getElementById('applicant-modal-body');

        if (!modalBackdrop || !modalBody) return;

        const accounts = DB.getApplicantAccounts();
        const account = accounts.find(a => a.email.toLowerCase() === email.toLowerCase());
        const applicantRecord = applicants.find(a => a.email.toLowerCase() === email.toLowerCase());

        const name = account ? account.fullName : (applicantRecord ? applicantRecord.name : 'Applicant');
        const jobTitle = applicantRecord ? applicantRecord.jobTitle : 'N/A';
        const currentStatus = applicantRecord ? applicantRecord.status : 'Pending';
        const contact = account ? (account.contactNumber || 'N/A') : 'N/A';
        const address = account ? (account.address || 'Not provided') : 'Not provided';
        const summary = account ? (account.professionalSummary || 'No professional summary provided.') : 'No professional summary provided.';

        if (modalName) modalName.textContent = name;
        if (modalJob) modalJob.textContent = `Applied Position: ${jobTitle}`;

        modalBody.innerHTML = `
            <div style="background:#f8fafc; padding:1.2rem; border-radius:8px; margin-bottom:1.2rem; border:1px solid #e2e8f0;">
                <p style="margin-bottom:0.4rem;"><strong>Email:</strong> ${escapeHTML(email)}</p>
                <p style="margin-bottom:0.4rem;"><strong>Contact:</strong> ${escapeHTML(contact)}</p>
                <p style="margin-bottom:0.4rem;"><strong>Address:</strong> ${escapeHTML(address)}</p>
                <p style="margin-bottom:0.4rem;"><strong>Applied Position:</strong> ${escapeHTML(jobTitle)}</p>
                <p><strong>Current Status:</strong> <span class="badge ${currentStatus === 'Accepted' ? 'badge-success' : (currentStatus === 'Rejected' ? 'badge-danger' : 'badge-warning')}">${currentStatus}</span></p>
            </div>

            <div style="margin-bottom:1.2rem;">
                <h5 style="font-weight:700; margin-bottom:0.5rem;">Professional Summary</h5>
                <p style="font-size:0.9rem; background:#fff; padding:0.8rem; border-radius:6px; border:1px solid #e2e8f0; color:#334155;">
                    ${escapeHTML(summary)}
                </p>
            </div>

            <div style="display:flex; gap:0.5rem; margin-top:1.5rem;">
                <button type="button" class="btn btn-primary btn-modal-accept" style="flex:1; background-color:#10b981;">
                    ✓ Approve / Accept Applicant
                </button>
                <button type="button" class="btn btn-danger btn-modal-reject" style="flex:1;">
                    ✕ Reject Applicant
                </button>
            </div>
        `;

        const btnAccept = modalBody.querySelector('.btn-modal-accept');
        const btnReject = modalBody.querySelector('.btn-modal-reject');

        if (btnAccept && applicantRecord) {
            btnAccept.addEventListener('click', async () => {
                applicantRecord.status = 'Accepted';
                DB.saveApplicants(applicants);
                await saveApplicantToFirebase(applicantRecord, null);
                showToast(`✓ Accepted ${name}!`);
                modalBackdrop.classList.remove('show');
                renderApplicants();
                renderDashboard();
            });
        }

        if (btnReject && applicantRecord) {
            btnReject.addEventListener('click', async () => {
                applicantRecord.status = 'Rejected';
                DB.saveApplicants(applicants);
                await saveApplicantToFirebase(applicantRecord, null);
                showToast(`✕ Rejected ${name}`);
                modalBackdrop.classList.remove('show');
                renderApplicants();
                renderDashboard();
            });
        }

        modalBackdrop.classList.add('show');
    }

    const btnCloseAppModal = document.getElementById('btn-close-applicant-modal');
    if (btnCloseAppModal) {
        btnCloseAppModal.addEventListener('click', () => {
            const modalBackdrop = document.getElementById('modal-applicant-profile-backdrop');
            if (modalBackdrop) modalBackdrop.classList.remove('show');
        });
    }

    const btnCloseAppFooter = document.getElementById('btn-close-applicant-modal-footer');
    if (btnCloseAppFooter) {
        btnCloseAppFooter.addEventListener('click', () => {
            const modalBackdrop = document.getElementById('modal-applicant-profile-backdrop');
            if (modalBackdrop) modalBackdrop.classList.remove('show');
        });
    }

    function renderMyResumeView() {
        const email = authState.currentUser;
        const accounts = DB.getApplicantAccounts();
        const account = accounts.find(a => a.email.toLowerCase() === email?.toLowerCase());

        if (!account) return;

        const fullNameInput = document.getElementById('my-fullname');
        const emailInput = document.getElementById('my-email');
        const contactInput = document.getElementById('my-contact');
        const addressInput = document.getElementById('my-address');
        const summaryInput = document.getElementById('my-summary');

        if (fullNameInput) fullNameInput.value = account.fullName || '';
        if (emailInput) emailInput.value = account.email || '';
        if (contactInput) contactInput.value = account.contactNumber || '';
        if (addressInput) addressInput.value = account.address || '';
        if (summaryInput) summaryInput.value = account.professionalSummary || '';
    }

    function init() {
        checkAuthentication();
    }

    init();
})();