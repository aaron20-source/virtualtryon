// script.js
// Contains all JavaScript logic for the Virtual TRY ON App (Multi-Page Version)
// Includes: Login/Register, Account Management, Studio (Model Selection/Upload/Scaling(cm/kg), Multi-Layer Clothing Selection/Upload(with name)/Adjustment, Outfit Saving to Gallery), Gallery Display/Management.
// Revision v10: Removed percentage from Visual Width Scale label.
// Revision v11: Added fix for hidden login/register toggle buttons on login.html.
// Revision v12: Fixed critical error in initStudioPage (document() -> document.getElementById()) and replaced local image paths with placeholders.

// --- Constants ---
const USERS_STORAGE_KEY = 'virtualTryOnUsers';
const LOGGED_IN_USER_EMAIL_KEY = 'virtualTryOnLoggedInUser';
const USER_GALLERY_KEY_PREFIX = 'virtualTryOnUserGallery_'; // Stores array of items (clothing or outfits)
const LAST_STUDIO_STATE_KEY = 'virtualTryOnLastStudioState'; // Stores model state (type, gender, height, weight) and background color
const USER_CATEGORIES_KEY_PREFIX = 'virtualTryOnUserCategories_'; // Stores { categoryName: type }
const USER_UPLOADED_MODEL_KEY_PREFIX = 'virtualTryOnUploadedModel_'; // Stores { gender, src }
const DEFAULT_BACKGROUND_COLOR = '#f1f5f9'; // Default background (slate-100)
const DEFAULT_MODEL_HEIGHT_CM = 170; // Baseline height for scaling
const DEFAULT_MODEL_WEIGHT_KG = 70; // Baseline weight for scaling

// --- Global State (Minimal) ---
let emailToReset = null;

// --- Predefined Data ---

// Default Models (Add baseline dimensions) - Using placeholders for robust loading
const predefinedModels = {
    female: { type: 'default', gender: 'female', name: 'Default Female', src: 'https://placehold.co/300x500/fbcfe8/ffffff?text=Female+Model', defaultHeightCm: 165, defaultWeightKg: 60 },
    male: { type: 'default', gender: 'male', name: 'Default Male', src: 'https://placehold.co/300x500/bfdbfe/ffffff?text=Male+Model', defaultHeightCm: 175, defaultWeightKg: 75 }
};

// Base Clothing Categories and their types ('top', 'bottom', 'other')
const baseClothingCategories = {
    'Tops/Shirts': 'top',
    'Outerwear': 'top',
    'Dresses': 'other', // Occupies both slots conceptually
    'Bottoms/Jeans': 'bottom',
    'Skirts': 'bottom',
};

// Predefined Clothing Items (Add 'type' based on category)
// Using placehold.co for image placeholders. Replaced local paths with placeholders.
const predefinedClothingItems = [
    { id: 'item_tops_1', name: 'Green short-sleeve shirt', src: './14th.png', category: 'Tops/Shirts', gender: 'unisex', type: 'top' },
    { id: 'item_tops_2', name: 'Black shirt with pockets', src: './17th.png', category: 'Tops/Shirts', gender: 'male', type: 'top' },
    { id: 'item_tops_3', name: 'White blouse with a bow', src: './12th.png', category: 'Tops/Shirts', gender: 'female', type: 'top' },
    // Outerwear
    { id: 'item_outer_1', name: 'Denim Jacket', src: './21.png', category: 'Outerwear', gender: 'unisex', type: 'top' },
    { id: 'item_outer_2', name: 'Black short-sleeve shirt with white stitching', src: './5th.png', category: 'Outerwear', gender: 'male', type: 'top' },
    { id: 'item_outer_3', name: 'Beige cropped sweater', src: './6th.png', category: 'Outerwear', gender: 'female', type: 'top' },
    // Dresses
    { id: 'item_dress_1', name: 'Black dress/Business casual', src: './22.png', category: 'Dresses', gender: 'female', type: 'other' },
    { id: 'item_dress_2', name: 'Brown sleeveless dress', src: './9th.png', category: 'Dresses', gender: 'female', type: 'other' },
    { id: 'item_dress_3', name: 'Red dress with pleats and gold buttons', src: './10th.png', category: 'Dresses', gender: 'female', type: 'other' },
    // Bottoms/Jeans
    { id: 'item_bottoms_1', name: 'Dark blue jeans', src: './2nd.png', category: 'Bottoms/Jeans', gender: 'unisex', type: 'bottom' },
    { id: 'item_bottoms_2', name: 'Black wide-leg pants', src: './20.png', category: 'Bottoms/Jeans', gender: 'male', type: 'bottom' },
    { id: 'item_bottoms_3', name: 'Marni low-rise Flared Trousers', src: './23.png', category: 'Bottoms/Jeans', gender: 'female', type: 'bottom' },

    // Skirts
    { id: 'item_skirt_1', name: 'Red pleated skirt', src: './7th.png', category: 'Skirts', gender: 'female', type: 'bottom' },
    { id: 'item_skirt_2', name: 'White ruched skirt', src: './8th.png', category: 'Skirts', gender: 'female', type: 'bottom' },
    { id: 'item_skirt_3', name: 'Black maxi skirt', src: './13th.png', category: 'Skirts', gender: 'female', type: 'bottom' },
    // Accessories (Examples)
];


// --- Utility Functions ---

// Get users array from localStorage
function getUsers() { try { const u = localStorage.getItem(USERS_STORAGE_KEY); return u ? JSON.parse(u) : []; } catch (e) { console.error("LS Error (getUsers):", e); return []; } }
// Save users array to localStorage
function saveUsers(users) { try { localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users)); } catch (e) { console.error("LS Error (saveUsers):", e); alert("Error saving user data."); } }
// Find a user by email (case-insensitive)
function findUserByEmail(email) { if (!email) return null; try { return getUsers().find(u => u.email.toLowerCase() === email.toLowerCase()) || null; } catch (e) { console.error("Error (findUserByEmail):", e); return null; } }
// Get the email of the currently logged-in user
function getLoggedInUserEmail() { try { return localStorage.getItem(LOGGED_IN_USER_EMAIL_KEY); } catch (e) { console.error("LS Error (getLoggedInUserEmail):", e); return null; } }
// Get the full user object for the logged-in user
function getLoggedInUser() { const e = getLoggedInUserEmail(); return e ? findUserByEmail(e) : null; }
// Save the last state of the studio (model type/gender/height/weight/background)
function saveLastStudioState(state) { try { localStorage.setItem(LAST_STUDIO_STATE_KEY, JSON.stringify(state)); } catch (e) { console.error("LS Error (saveLastStudioState):", e); } }
// Get the last saved studio state
function getLastStudioState() { try { const s = localStorage.getItem(LAST_STUDIO_STATE_KEY); return s ? JSON.parse(s) : null; } catch (e) { console.error("LS Error (getLastStudioState):", e); return null; } }

// --- Gallery Management (Stores item objects: clothing or outfits) ---
// *** UPDATED: Handles both clothing items and saved outfit objects ***
function getUserGallery(email) {
    if (!email) return [];
    try {
        const key = `${USER_GALLERY_KEY_PREFIX}${email.toLowerCase()}`;
        const galleryJson = localStorage.getItem(key);
        return galleryJson ? JSON.parse(galleryJson) : []; // Array of item objects (clothing or outfit)
    } catch (e) { console.error("LS Error (getUserGallery):", e); return []; }
}
function saveUserGallery(email, galleryItems) {
    if (!email) return;
    try {
        const key = `${USER_GALLERY_KEY_PREFIX}${email.toLowerCase()}`;
        localStorage.setItem(key, JSON.stringify(galleryItems));
    } catch (e) { console.error("LS Error (saveUserGallery):", e); alert("Could not save item to gallery."); }
}
// *** UPDATED: Adds clothing OR outfit objects. Checks duplicates based on item.id ***
function addToUserGallery(email, item) {
    if (!email || !item || !item.id) { // All gallery items need an ID now
        console.error("addToUserGallery: Invalid item or missing ID.", item);
        return false;
    }
    const gallery = getUserGallery(email);

    // Prevent duplicates based on ID
    if (!gallery.some(galleryItem => galleryItem && galleryItem.id === item.id)) {
        // Ensure essential properties exist based on type
        let itemToSave = {};
        if (item.itemType === 'outfit') {
            itemToSave = {
                id: item.id, // e.g., outfit_[timestamp]
                itemType: 'outfit',
                name: item.name || 'Saved Outfit',
                src: item.src, // This will be the dataURL from canvas
                createdAt: item.createdAt || Date.now(),
                // Optionally add metadata about model/clothes used if needed later
                // modelUsed: item.modelUsed,
                // clothingUsed: item.clothingUsed
            };
        } else { // Assume 'clothing' type
             itemToSave = {
                id: item.id, // e.g., item_tops_1 or uploaded_[timestamp]
                itemType: 'clothing',
                src: item.src,
                name: item.name || 'Gallery Item',
                category: item.category || 'Unknown',
                gender: item.gender || 'unisex',
                type: item.type || getItemType(item) // Ensure clothing type ('top', 'bottom', 'other') is saved
            };
        }

        gallery.push(itemToSave);
        saveUserGallery(email, gallery);
        console.log(`${itemToSave.itemType.toUpperCase()} added to gallery:`, itemToSave.name);
        return true;
    } else {
        console.log(`${item.itemType.toUpperCase()} already in gallery (based on ID):`, item.name);
        return false; // Indicate it wasn't added (already exists)
    }
}
// *** UPDATED: Removes items based on ID ***
function removeFromUserGallery(email, itemId) {
    if (!email || !itemId) return;
    let gallery = getUserGallery(email);
    const initialLength = gallery.length;
    gallery = gallery.filter(item => item && item.id !== itemId); // Filter by ID
    if (gallery.length < initialLength) {
        saveUserGallery(email, gallery);
        console.log("Item removed from gallery (ID):", itemId);
    } else {
        console.warn("Item not found in gallery for removal (ID):", itemId);
    }
}

// --- User Category Management (Stores { categoryName: type }) ---
function getUserCategories(email) {
    if (!email) return { ...baseClothingCategories }; // Return copy of base if no user
    try {
        const key = `${USER_CATEGORIES_KEY_PREFIX}${email.toLowerCase()}`;
        const categoriesJson = localStorage.getItem(key);
        const userCats = categoriesJson ? JSON.parse(categoriesJson) : {};
        // Combine base and user categories, user overrides base if names clash (though UI prevents adding base names)
        return { ...baseClothingCategories, ...userCats };
    } catch (e) {
        console.error("LS Error (getUserCategories):", e);
        return { ...baseClothingCategories }; // Fallback to base
    }
}
function addUserCategory(email, categoryName, categoryType) {
    if (!email || !categoryName || !categoryType || !['top', 'bottom', 'other'].includes(categoryType)) {
        console.warn("addUserCategory: Invalid input", { email, categoryName, categoryType });
        return false;
    }
    const categoryTrimmed = categoryName.trim();
    if (!categoryTrimmed || baseClothingCategories.hasOwnProperty(categoryTrimmed)) {
        console.warn(`addUserCategory: Cannot add empty or base category name "${categoryTrimmed}"`);
        return false; // Don't add empty or overwrite base
    }

    try {
        const key = `${USER_CATEGORIES_KEY_PREFIX}${email.toLowerCase()}`;
        const categoriesJson = localStorage.getItem(key);
        let userCats = categoriesJson ? JSON.parse(categoriesJson) : {};
        if (!userCats.hasOwnProperty(categoryTrimmed)) {
            userCats[categoryTrimmed] = categoryType;
            localStorage.setItem(key, JSON.stringify(userCats));
            console.log(`Added category "${categoryTrimmed}" (type: ${categoryType}) for user ${email}`);
            return true;
        }
        console.log(`addUserCategory: Category "${categoryTrimmed}" already exists for user.`);
        return false; // Already exists
    } catch (e) {
        console.error("LS Error (addUserCategory):", e);
        return false;
    }
}
// Get the type ('top', 'bottom', 'other') of a clothing item based on its category
function getItemType(item) {
    // Check if item is an outfit - outfits don't have a clothing type
    if (item && item.itemType === 'outfit') {
        return null;
    }
    // Proceed for clothing items
    if (item && item.type && ['top', 'bottom', 'other'].includes(item.type)) {
        return item.type; // Use pre-defined type if valid
    }
    if (item && item.category) {
        const user = getLoggedInUser();
        const allCategories = getUserCategories(user?.email); // Get combined categories { name: type }
        const type = allCategories[item.category];
        if (['top', 'bottom', 'other'].includes(type)) {
            return type; // Return type from lookup if valid
        }
    }
    // console.warn("getItemType: Could not determine valid type for item, defaulting to 'other'. Item:", item);
    return 'other'; // Default if no category or type not found/invalid
}

// --- Uploaded Model Management ---
function saveUploadedModelData(email, modelData) { if (!email || !modelData || !modelData.gender || !modelData.src) return; try { const key = `${USER_UPLOADED_MODEL_KEY_PREFIX}${email.toLowerCase()}`; localStorage.setItem(key, JSON.stringify(modelData)); console.log("Saved uploaded model data for", email); } catch (e) { console.error("LS Error (saveUploadedModelData):", e); alert("Error saving uploaded model data."); } }
function getUploadedModelData(email) { if (!email) return null; try { const key = `${USER_UPLOADED_MODEL_KEY_PREFIX}${email.toLowerCase()}`; const data = localStorage.getItem(key); return data ? JSON.parse(data) : null; } catch (e) { console.error("LS Error (getUploadedModelData):", e); return null; } }
function deleteUploadedModelData(email) { if (!email) return; try { const key = `${USER_UPLOADED_MODEL_KEY_PREFIX}${email.toLowerCase()}`; localStorage.removeItem(key); console.log("Deleted uploaded model data for", email); } catch (e) { console.error("LS Error (deleteUploadedModelData):", e); } }

// --- Authentication & Navigation ---
function requireLogin() { if (!getLoggedInUserEmail()) { console.log("User not logged in. Redirecting..."); window.location.href = 'login.html'; } }
function redirectIfLoggedIn() { if (getLoggedInUserEmail()) { console.log("User already logged in. Redirecting..."); window.location.href = 'studio.html'; } }
function handleLogout() { try { const email = getLoggedInUserEmail(); localStorage.removeItem(LOGGED_IN_USER_EMAIL_KEY); localStorage.removeItem(LAST_STUDIO_STATE_KEY); /* Optionally clear uploaded model on logout? deleteUploadedModelData(email); */ console.log("User logged out."); window.location.href = 'login.html'; } catch(e) { console.error("Error during logout:", e); window.location.href = 'login.html'; } }

// --- Form Validation Helpers ---
function togglePasswordVisibility(event) { const icon = event.target.closest('.password-toggle-icon'); if (!icon) return; const targetId = icon.getAttribute('data-target'); if (!targetId) return; const passwordInput = document.getElementById(targetId); if (passwordInput) { const isPassword = passwordInput.type === 'password'; passwordInput.type = isPassword ? 'text' : 'password'; icon.classList.toggle('fa-eye', !isPassword); icon.classList.toggle('fa-eye-slash', isPassword); } }
function setErrorFor(input, message) { if (!input) return; const formControl = input.closest('.form-control') || input.closest('div'); if (!formControl) return; const small = formControl.querySelector('small'); formControl.classList.remove('success'); formControl.classList.add('error'); if (small) small.innerText = message; input.classList.add('border-red-500', '!ring-red-500'); input.classList.remove('border-green-500', '!ring-green-500'); }
function setSuccessFor(input) { if (!input) return; const formControl = input.closest('.form-control') || input.closest('div'); if (!formControl) return; const small = formControl.querySelector('small'); formControl.classList.remove('error'); formControl.classList.add('success'); if (small) small.innerText = ''; input.classList.remove('border-red-500', '!ring-red-500'); input.classList.add('border-green-500', '!ring-green-500'); }
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());
function clearFormStates(forms) { forms.forEach(form => { if (!form) return; form.querySelectorAll('.form-control, div').forEach(fc => { fc.classList.remove('success', 'error'); const input = fc.querySelector('input, select'); if(input) { input.classList.remove('border-red-500', '!ring-red-500', 'border-green-500', '!ring-green-500'); } }); form.querySelectorAll('.error-message, .success-message').forEach(msg => { msg.classList.add('hidden'); msg.textContent = ''; }); }); }
function clearValidationState(input) { if (!input) return; const fc = input.closest('.form-control') || input.closest('div'); if (fc) { fc.classList.remove('success', 'error'); const s = fc.querySelector('small'); if (s) s.innerText = ''; input.classList.remove('border-red-500', '!ring-red-500', 'border-green-500', '!ring-green-500'); } }
// Display message helper
function showMessage(element, text, isError = false, duration = 3000) { if (!element) return; element.textContent = text; element.classList.remove('hidden', 'text-red-600', 'text-green-600'); element.classList.add(isError ? 'text-red-600' : 'text-green-600'); if (duration > 0) { setTimeout(() => element.classList.add('hidden'), duration); } }


// --- Page-Specific Initialization Functions ---

/**
 * Initializes the Login/Register page functionality (sliding panel).
 */
function initLoginPage() {
    console.log("Initializing Login Page (v11 - Fixed toggle button visibility)");
    redirectIfLoggedIn(); // Redirect if already logged in

    // Get necessary elements for the sliding panel and forms
    const container = document.getElementById('container');
    const registerBtn = document.getElementById('register'); // This is the toggle button
    const loginBtn = document.getElementById('login'); // This is the toggle button
    const loginForm = document.getElementById('login-form'); // This is the actual form
    const registerForm = document.getElementById('register-form'); // This is the actual form
    const loginEmailInput = document.getElementById('login-email');
    const loginPasswordInput = document.getElementById('login-password');
    const loginError = document.getElementById('login-error');
    const registerNameInput = document.getElementById('register-name');
    const registerEmailInput = document.getElementById('register-email');
    const registerPasswordInput = document.getElementById('register-password');
    const registerMessage = document.getElementById('register-message');
    const registerError = document.getElementById('register-error');

    // Check if core elements exist
    if (!container || !registerBtn || !loginBtn || !loginForm || !registerForm) {
        console.error("Login/Register core elements missing!");
        return;
    }

    // --- FIX: Make the toggle buttons visible ---
    // These buttons are initially hidden in HTML but are needed to switch panels.
    registerBtn.classList.remove('hidden');
    loginBtn.classList.remove('hidden');
    // --- End FIX ---


    // Event listeners for toggling between login and register panels
    registerBtn.addEventListener('click', () => {
        container.classList.add("active");
        clearFormStates([loginForm, registerForm]); // Clear validation states when switching
    });
    loginBtn.addEventListener('click', () => {
        container.classList.remove("active");
        clearFormStates([loginForm, registerForm]); // Clear validation states when switching
    });

    // Login Form Submission Logic
    if (loginForm && loginEmailInput && loginPasswordInput && loginError) { // Added check for loginForm
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault(); // Prevent default form submission
            loginError.classList.add('hidden'); // Hide previous errors
            clearFormStates([loginForm]); // Clear previous validation styles

            // Get and validate input values
            const email = loginEmailInput.value.trim();
            const password = loginPasswordInput.value;
            let isValid = true;

            if (email === '' || !isValidEmail(email)) {
                setErrorFor(loginEmailInput, 'Valid email is required');
                isValid = false;
            } else {
                setSuccessFor(loginEmailInput);
            }

            if (password === '') {
                setErrorFor(loginPasswordInput, 'Password cannot be blank');
                isValid = false;
            } else {
                setSuccessFor(loginPasswordInput);
            }

            // If validation fails, stop processing
            if (!isValid) { return; }

            // Check credentials (INSECURE: Plain text password check)
            const user = findUserByEmail(email);
            if (user && user.password === password) {
                // Successful login: Save user email and redirect
                localStorage.setItem(LOGGED_IN_USER_EMAIL_KEY, user.email);
                window.location.href = 'studio.html'; // Redirect to the main studio page
            } else {
                // Failed login: Show error message
                showMessage(loginError, "Invalid email or password.", true, 0); // Show persistent error
                setErrorFor(loginEmailInput, ' '); // Mark fields as potentially incorrect
                setErrorFor(loginPasswordInput, ' ');
            }
        });
    } else {
        console.error("Login form input/error elements missing.");
    }

    // Register Form Submission Logic
    if (registerForm && registerNameInput && registerEmailInput && registerPasswordInput && registerMessage && registerError) { // Added check for registerForm
        registerForm.addEventListener('submit', (event) => {
            event.preventDefault(); // Prevent default form submission
            registerError.classList.add('hidden'); // Hide previous errors
            registerMessage.classList.add('hidden');
            clearFormStates([registerForm]); // Clear previous validation styles

            // Get and validate input values
            const name = registerNameInput.value.trim();
            const email = registerEmailInput.value.trim();
            const password = registerPasswordInput.value;
            let isValid = true;

            if (name === '') {
                setErrorFor(registerNameInput, 'Full Name cannot be blank');
                isValid = false;
            } else {
                setSuccessFor(registerNameInput);
            }

            if (email === '' || !isValidEmail(email)) {
                setErrorFor(registerEmailInput, 'Valid email is required');
                isValid = false;
            } else if (findUserByEmail(email)) { // Check if email is already registered
                setErrorFor(registerEmailInput, 'Email already registered');
                isValid = false;
            } else {
                setSuccessFor(registerEmailInput);
            }

            if (password === '' || password.length < 6) {
                setErrorFor(registerPasswordInput, 'Password must be at least 6 characters');
                isValid = false;
            } else {
                setSuccessFor(registerPasswordInput);
            }

            // If validation fails, show error and stop processing
            if (!isValid) {
                showMessage(registerError, "Please correct the errors above.", true, 0); // Show persistent error
                return;
            }

            // Create new user and save (INSECURE: Storing password directly)
            const users = getUsers();
            const newUser = { name, email, password };
            users.push(newUser);
            saveUsers(users);

            // Show success message, reset form, and switch back to login panel
            showMessage(registerMessage, "Registration successful! Please Sign In.", false, 3000); // Show success message briefly
            registerForm.reset(); // Clear the form fields
            clearFormStates([registerForm]); // Clear validation styles
            setTimeout(() => {
                if (container) container.classList.remove("active"); // Switch back to login view
            }, 1500); // Delay to allow user to see the success message
        });
    } else {
        console.error("Register form input/message elements missing.");
    }
}


/**
 * Initializes the Forgot Password page functionality.
 */
function initForgotPasswordPage() {
    console.log("Initializing Forgot Password Page");
    redirectIfLoggedIn(); // Redirect if already logged in

    // Get necessary elements
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const resetPasswordForm = document.getElementById('reset-password-form');
    const forgotEmailInput = document.getElementById('forgot-email');
    const resetNewPasswordInput = document.getElementById('reset-new-password');
    const resetConfirmPasswordInput = document.getElementById('reset-confirm-password');
    const forgotError = document.getElementById('forgot-error');
    const resetError = document.getElementById('reset-error');
    const resetSuccess = document.getElementById('reset-success');
    const resetEmailDisplay = document.getElementById('reset-email-display');
    const cancelResetLink = document.getElementById('cancel-reset-link');

    // Check if core forms exist
    if (!forgotPasswordForm || !resetPasswordForm) {
        console.error("Forgot/Reset password forms not found!");
        return;
    }

    // Initial state: Show email verification form, hide reset form
    forgotPasswordForm.classList.add('active');
    resetPasswordForm.classList.remove('active');
    emailToReset = null; // Clear any previously stored email

    // Step 1: Verify Email Form Logic
    if (forgotPasswordForm && forgotEmailInput && forgotError && resetEmailDisplay) { // Added check for forgotPasswordForm
        forgotPasswordForm.addEventListener('submit', (event) => {
             event.preventDefault(); // Prevent default submission
             forgotError.classList.add('hidden'); // Hide previous errors
             clearValidationState(forgotEmailInput); // Clear previous validation style

             // Get and validate email
             const email = forgotEmailInput.value.trim();
             if (email === '' || !isValidEmail(email)) {
                 setErrorFor(forgotEmailInput, 'Enter a valid email address');
                 showMessage(forgotError, 'Please enter a valid email.', true, 0); // Show persistent error
                 return;
             }

             // Check if email exists
             const user = findUserByEmail(email);
             if (user) {
                // Email found: Store it, update display, switch forms
                emailToReset = email;
                resetEmailDisplay.textContent = email; // Show email in the reset section
                forgotPasswordForm.classList.remove('active'); // Hide email form
                resetPasswordForm.classList.add('active'); // Show reset form
                resetPasswordForm.reset(); // Clear password fields
                clearValidationState(resetNewPasswordInput); // Clear validation styles
                clearValidationState(resetConfirmPasswordInput);
                resetError?.classList.add('hidden'); // Hide previous reset errors/success
                resetSuccess?.classList.add('hidden');
                setSuccessFor(forgotEmailInput); // Mark email input as successful
             } else {
                 // Email not found: Show error
                 setErrorFor(forgotEmailInput, ' '); // Mark field as potentially incorrect
                 showMessage(forgotError, "This email address is not registered.", true, 0); // Show persistent error
             }
        });
    } else {
        console.error("Forgot password form elements missing.");
    }

    // Step 2: Reset Password Form Logic
    if (resetPasswordForm && resetNewPasswordInput && resetConfirmPasswordInput && resetError && resetSuccess) { // Added check for resetPasswordForm
         resetPasswordForm.addEventListener('submit', (event) => {
            event.preventDefault(); // Prevent default submission
            resetError.classList.add('hidden'); // Hide previous errors/success
            resetSuccess.classList.add('hidden');
            clearValidationState(resetNewPasswordInput); // Clear previous validation styles
            clearValidationState(resetConfirmPasswordInput);

            // Get and validate passwords
            const newPassword = resetNewPasswordInput.value;
            const confirmPassword = resetConfirmPasswordInput.value;
            let isValid = true;

            if (newPassword === '' || newPassword.length < 6) {
                setErrorFor(resetNewPasswordInput, 'Password must be at least 6 characters');
                isValid = false;
            } else {
                setSuccessFor(resetNewPasswordInput);
            }

            if (confirmPassword === '') {
                setErrorFor(resetConfirmPasswordInput, 'Please confirm your new password');
                isValid = false;
            } else if (newPassword !== confirmPassword) {
                setErrorFor(resetConfirmPasswordInput, 'Passwords do not match');
                isValid = false;
            } else if (isValid) { // Only set success if the first password was also valid
                setSuccessFor(resetConfirmPasswordInput);
            }

            // If validation fails, show error and stop
            if (!isValid) {
                showMessage(resetError, "Please correct the errors above.", true, 0); // Show persistent error
                return;
            }

            // Check if emailToReset is still valid (should be set from step 1)
            if (!emailToReset) {
                showMessage(resetError, "Session error. Please start the password reset process over.", true, 0);
                // Optionally switch back to the email form after a delay
                setTimeout(() => {
                    resetPasswordForm.classList.remove('active');
                    forgotPasswordForm?.classList.add('active');
                }, 3000);
                return;
            }

            // Find user and update password (INSECURE: Updating plain text password)
            const users = getUsers();
            const userIndex = users.findIndex(u => u.email.toLowerCase() === emailToReset.toLowerCase());
            if (userIndex === -1) {
                // Should not happen if email was verified, but handle defensively
                showMessage(resetError, "Error finding account. Please try again.", true, 0);
                return;
            }
            users[userIndex].password = newPassword; // Update the password
            saveUsers(users); // Save the updated user list

            // Show success message and redirect to login
            showMessage(resetSuccess, "Password successfully reset! Redirecting...", false, 2500); // Show success briefly
            emailToReset = null; // Clear the stored email
            setTimeout(() => {
                window.location.href = 'login.html'; // Redirect after delay
            }, 2500);
         });
    } else {
        console.error("Reset password form elements missing.");
    }

    // Cancel Link Logic
    if (cancelResetLink) {
        cancelResetLink.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior
            window.location.href = 'login.html'; // Go back to login page
        });
    }
}


/**
 * Initializes the Account Settings page. Displays user info, handles account deletion.
 */
function initAccountPage() {
    console.log("Initializing Account Page");
    requireLogin(); // Ensure user is logged in
    const user = getLoggedInUser(); // Get logged-in user details

    // If user data isn't found (e.g., localStorage cleared manually), handle logout
    if (!user) {
        console.error("Account page: User not found despite requireLogin check.");
        handleLogout();
        return;
    }

    // Get necessary elements
    const accountName = document.getElementById('account-name');
    const accountEmail = document.getElementById('account-email');
    const deleteAccountBtn = document.getElementById('delete-account-btn');
    const deleteAccountError = document.getElementById('delete-account-error');

    // Display user information
    if (accountName) {
        accountName.textContent = user.name;
    } else {
        console.error("Account name display element not found.");
    }
    if (accountEmail) {
        accountEmail.textContent = user.email;
    } else {
        console.error("Account email display element not found.");
    }

    // Delete Account Button Logic
    if (deleteAccountBtn && deleteAccountError) {
        deleteAccountBtn.addEventListener('click', () => {
            deleteAccountError.classList.add('hidden'); // Hide previous errors

            // Prompt for confirmation, requiring user to type their email
            const confirmation = prompt(`This action is irreversible and will delete your account and all associated data (gallery, uploaded models, custom categories).\n\nType your email "${user.email}" to confirm deletion:`);

            // Handle cancellation
            if (confirmation === null) {
                showMessage(deleteAccountError, "Account deletion cancelled.", false, 3000); // Show cancellation message briefly
                return;
            }

            // Check if the typed email matches the user's email (case-insensitive)
            if (confirmation.toLowerCase() === user.email.toLowerCase()) {
                // --- Perform Deletion ---
                try {
                    const emailLower = user.email.toLowerCase(); // Store email before removing user data

                    // 1. Remove user from the main users list
                    let users = getUsers();
                    users = users.filter(u => u.email.toLowerCase() !== emailLower);
                    saveUsers(users);

                    // 2. Remove associated data from localStorage using specific keys
                    localStorage.removeItem(`${USER_GALLERY_KEY_PREFIX}${emailLower}`);
                    localStorage.removeItem(`${USER_UPLOADED_MODEL_KEY_PREFIX}${emailLower}`);
                    localStorage.removeItem(`${USER_CATEGORIES_KEY_PREFIX}${emailLower}`);
                    // Optionally clear last studio state/item if desired (might affect next login)
                    localStorage.removeItem(LAST_STUDIO_STATE_KEY);

                    // 3. Log out and redirect
                    alert("Account successfully deleted."); // Notify user via alert
                    // Call handleLogout AFTER removing data to ensure the logged-in key is also removed
                    handleLogout();

                } catch (error) {
                    // Handle potential errors during deletion
                    console.error("Error deleting account:", error);
                    showMessage(deleteAccountError, "An error occurred while deleting the account. Please try again.", true, 0); // Show persistent error
                }
            } else {
                // Confirmation email did not match
                showMessage(deleteAccountError, "Confirmation email did not match. Account deletion cancelled.", true, 0); // Show persistent error
            }
        });
    } else {
        console.error("Delete account button or error message element missing.");
    }
}


/**
 * Initializes the main Virtual Try-On Studio page (v12 - Fixed critical error and local paths).
 */
function initStudioPage() {
    console.log("Initializing Studio Page (v12 - Fixed critical error and local paths)");
    requireLogin(); // Ensure user is logged in
    const user = getLoggedInUser(); // Get user data
    if (!user) { console.error("Studio page: User not found."); handleLogout(); return; }

    // --- Get DOM Elements ---
    const modelSelectionArea = document.getElementById('model-selection-area');
    // *** UPDATED: Model size sliders ***
    const heightSlider = document.getElementById('height-slider');
    const heightValueSpan = document.getElementById('height-value');
    const weightSlider = document.getElementById('weight-slider'); // Renamed from width-slider
    const weightValueSpan = document.getElementById('weight-value'); // Renamed from width-value
    const mannequinContainer = document.getElementById('studio-mannequin-container');
    const modelImageFemale = document.getElementById('model-image-female');
    const modelImageMale = document.getElementById('model-image-male');
    const modelImageUploaded = document.getElementById('model-image-uploaded');
    const clothingOverlayTop = document.getElementById('studio-clothing-overlay-top');
    const clothingOverlayBottom = document.getElementById('studio-clothing-overlay-bottom');
    const uploadClothingBtn = document.getElementById('upload-clothing-btn');
    const clothingFileInput = document.getElementById('clothing-file-input'); // Hidden input
    const selectGalleryBtn = document.getElementById('select-gallery-btn');
    // const selectedClothingPreview = document.getElementById('selected-clothing-preview'); // Removed
    // const clothingPreviewImg = document.getElementById('clothing-preview-img'); // Removed
    // const selectedClothingNameSpan = document.getElementById('selected-clothing-name'); // Removed
    // const saveGalleryBtn = document.getElementById('save-gallery-btn'); // Removed (replaced by save-outfit-btn)
    // const saveGalleryMessage = document.getElementById('save-gallery-message'); // Removed
    const saveOutfitBtn = document.getElementById('save-outfit-btn'); // *** NEW: Save Outfit Button ***
    const saveOutfitMessage = document.getElementById('save-outfit-message'); // *** NEW: Save Outfit Message Area ***
    const bgColorPicker = document.getElementById('bg-color-picker');
    const clearOutfitBtn = document.getElementById('clear-outfit-btn');
    const studioErrorMessage = document.getElementById('studio-error-message');
    const studioSuccessMessage = document.getElementById('studio-success-message');
    const clothingControlsContainer = document.getElementById('clothing-controls');
    const adjustingItemTypeSpan = document.getElementById('adjusting-item-type');
    const scaleSlider = document.getElementById('clothing-scale-slider');
    const scaleValueSpan = document.getElementById('clothing-scale-value');
    const xSlider = document.getElementById('clothing-x-slider');
    const xValueSpan = document.getElementById('clothing-x-value');
    const ySlider = document.getElementById('clothing-y-slider');
    const yValueSpan = document.getElementById('clothing-y-value');
    const opacitySlider = document.getElementById('clothing-opacity-slider');
    const opacityValueSpan = document.getElementById('clothing-opacity-value');
    const resetClothingBtn = document.getElementById('reset-clothing-btn');
    const categoryFiltersContainer = document.getElementById('category-filters');
    const clothingItemGrid = document.getElementById('clothing-item-grid');
    const getSizeRecBtn = document.getElementById('get-size-recommendation-btn');
    const sizeRecOutput = document.getElementById('size-recommendation-output');
    const outfitCanvas = document.getElementById('outfit-canvas'); // *** NEW: Hidden Canvas ***
    const outfitCtx = outfitCanvas ? outfitCanvas.getContext('2d') : null; // *** NEW: Canvas Context ***

    // Upload Model Elements
    const uploadModelForm = document.getElementById('upload-model-form');
    const modelFileInput = document.getElementById('model-file-input');
    const uploadModelSubmitBtn = document.getElementById('upload-model-submit-btn');
    const uploadModelMessage = document.getElementById('upload-model-message');
    const uploadedModelSelectorDiv = document.getElementById('uploaded-model-selector');
    const uploadedModelPreviewBtn = document.getElementById('uploaded-model-preview-btn');
    // FIX: Corrected document() to document.getElementById()
    const removeUploadedModelBtn = document.getElementById('remove-uploaded-model-btn'); // *** NEW: Remove Uploaded Model Button ***


    // Upload Clothing Modal Elements
    const uploadModal = document.getElementById('upload-modal');
    const uploadModalCloseBtn = document.getElementById('upload-modal-close');
    const uploadModalCancelBtn = document.getElementById('upload-modal-cancel');
    const uploadModalConfirmBtn = document.getElementById('upload-modal-confirm');
    const uploadDetailsForm = document.getElementById('upload-details-form');
    const uploadClothingNameInput = document.getElementById('upload-clothing-name'); // *** NEW: Clothing Name Input ***
    const uploadCategorySelect = document.getElementById('upload-category-select');
    const newCategoryInputContainer = document.getElementById('new-category-input-container');
    const newCategoryNameInput = document.getElementById('new-category-name');
    const newCategoryTypeSelect = document.getElementById('new-category-type');
    const uploadModalError = document.getElementById('upload-modal-error');

    // --- Check if essential elements exist ---
    if (!modelSelectionArea || !modelImageFemale || !modelImageMale || !modelImageUploaded ||
        !clothingOverlayTop || !clothingOverlayBottom || !clothingFileInput || !clothingControlsContainer ||
        !mannequinContainer || !categoryFiltersContainer || !clothingItemGrid || !uploadModal ||
        !getSizeRecBtn || !sizeRecOutput || !uploadModelForm || !modelFileInput ||
        !uploadedModelSelectorDiv || !uploadedModelPreviewBtn || !adjustingItemTypeSpan ||
        !bgColorPicker || !studioSuccessMessage || !heightSlider || !weightSlider || // Check new sliders
        !uploadClothingNameInput || !saveOutfitBtn || !saveOutfitMessage || !outfitCanvas || !outfitCtx || // Check new elements
        !removeUploadedModelBtn // Check new remove button
       ) {
        console.error("Essential studio page elements are missing! Cannot initialize.");
        // Display the critical error message if essential elements are missing
        const errorDisplay = document.getElementById('studio-error-message');
        if (errorDisplay) {
            errorDisplay.textContent = "A critical error occurred while loading the studio interface. Please refresh.";
            errorDisplay.classList.remove('hidden');
        } else {
            alert("A critical error occurred while loading the studio interface. Please refresh.");
        }
        return;
    }

    // --- State Variables ---
    let currentModel = null; // { type: 'default'/'uploaded', gender: 'female'/'male', src: '...', name: '...', defaultHeightCm: ..., defaultWeightKg: ... }
    // *** UPDATED: Model size state ***
    let currentModelHeightCm = DEFAULT_MODEL_HEIGHT_CM;
    let currentModelWeightKg = DEFAULT_MODEL_WEIGHT_KG;
    let currentBackgroundColor = DEFAULT_BACKGROUND_COLOR; // Default background color
    let currentTopItem = null; // Stores the clothing object {src, category, name, type, id, gender, itemType: 'clothing'}
    let currentBottomItem = null; // Stores the clothing object {src, category, name, type, id, gender, itemType: 'clothing'}
    let lastSelectedItemType = null; // 'top' or 'bottom' - determines which item controls affect
    // Store transform states separately for top and bottom layers
    let transformState = {
        top: { scale: 1, x: 0, y: 0, opacity: 1 },
        bottom: { scale: 1, x: 0, y: 0, opacity: 1 }
    };
    let isDragging = false, startX, startY, initialX, initialY;
    let activeModelImageElement = null; // Reference to the currently visible model <img>
    let availableCategories = {}; // Will hold combined base + user categories { name: type }
    let uploadedModelData = null; // Holds { gender, src } for the user's uploaded model
    let draggedOverlayElement = null; // Track which overlay (top/bottom) is being dragged

    // --- Model Handling ---

    /** Calculates the CSS scale factor based on current cm/kg vs a baseline */
    function calculateModelScaleFactors() {
        const modelBaselineHeight = currentModel?.defaultHeightCm || DEFAULT_MODEL_HEIGHT_CM;
        const modelBaselineWeight = currentModel?.defaultWeightKg || DEFAULT_MODEL_WEIGHT_KG;

        // Simple linear scaling. Adjust baseline values as needed.
        // Avoid division by zero or negative values.
        const scaleY = modelBaselineHeight > 0 ? Math.max(0.5, Math.min(1.5, currentModelHeightCm / modelBaselineHeight)) : 1;
        const scaleX = modelBaselineWeight > 0 ? Math.max(0.5, Math.min(1.5, currentModelWeightKg / modelBaselineWeight)) : 1;

        // console.log(`Height: ${currentModelHeightCm}cm (Base: ${modelBaselineHeight}cm) -> ScaleY: ${scaleY.toFixed(2)}`);
        // console.log(`Weight: ${currentModelWeightKg}kg (Base: ${modelBaselineWeight}kg) -> ScaleX: ${scaleX.toFixed(2)}`);

        return { scaleX, scaleY };
    }

    /** Applies the current scale (calculated from cm/kg) to the active model image */
    function applyModelScale() {
        if (activeModelImageElement) {
            const { scaleX, scaleY } = calculateModelScaleFactors();
            // Apply scale using CSS transform
            activeModelImageElement.style.transform = `scale(${scaleX}, ${scaleY})`;
            // console.log(`Applied model scale: X=${scaleX.toFixed(2)}, Y=${scaleY.toFixed(2)}`);
        }
    }

    /** Selects the model (default or uploaded) and updates the display */
    function selectModel(modelData) {
        if (!modelData || !modelData.type || !modelData.gender || !modelData.src) {
            console.error("Invalid model data provided to selectModel:", modelData);
            currentModel = { ...predefinedModels.female }; // Fallback
            activeModelImageElement = modelImageFemale;
        } else {
            currentModel = { ...modelData }; // Includes defaultHeightCm, defaultWeightKg now
            console.log(`Selecting model: ${currentModel.name || currentModel.type} (${currentModel.gender})`);
            activeModelImageElement = (currentModel.type === 'uploaded') ? modelImageUploaded : (currentModel.gender === 'female' ? modelImageFemale : modelImageMale);
            if (currentModel.type === 'uploaded') {
                modelImageUploaded.src = currentModel.src;
                modelImageUploaded.dataset.gender = currentModel.gender;
                 // Assign default dimensions if uploaded model doesn't have them (e.g., from old state)
                if (!currentModel.defaultHeightCm) currentModel.defaultHeightCm = DEFAULT_MODEL_HEIGHT_CM;
                if (!currentModel.defaultWeightKg) currentModel.defaultWeightKg = DEFAULT_MODEL_WEIGHT_KG;
            }
        }

        // Hide all, show selected
        [modelImageFemale, modelImageMale, modelImageUploaded].forEach(img => {
            img.classList.add('hidden');
            img.style.transform = 'scale(1)'; // Reset transform before hiding
        });
        activeModelImageElement.classList.remove('hidden');

        // *** UPDATED: Reset size sliders to model's defaults (or app defaults) ***
        const defaultHeight = currentModel.defaultHeightCm || DEFAULT_MODEL_HEIGHT_CM;
        const defaultWeight = currentModel.defaultWeightKg || DEFAULT_MODEL_WEIGHT_KG;
        currentModelHeightCm = defaultHeight;
        currentModelWeightKg = defaultWeight;
        if (heightSlider) heightSlider.value = currentModelHeightCm; if (heightValueSpan) heightValueSpan.textContent = currentModelHeightCm;
        // Update weight slider value display without percentage
        if (weightSlider) weightSlider.value = currentModelWeightKg; if (weightValueSpan) weightValueSpan.textContent = currentModelWeightKg;

        applyModelScale(); // Apply the scale

        // Update button/preview styling
        document.querySelectorAll('.model-select-btn, .uploaded-model-preview').forEach(btn => {
            btn.classList.remove('selected', 'border-pink-500', 'border-blue-500', 'border-violet-700', 'ring-2', 'ring-offset-1', 'ring-pink-300', 'ring-blue-300', 'ring-violet-300');
            const btnType = btn.dataset.modelType; const btnGender = btn.dataset.gender;
            if (btnType === currentModel.type && (btnType === 'uploaded' || btnGender === currentModel.gender)) {
                btn.classList.add('selected'); let color = btnType === 'uploaded' ? 'violet' : (btnGender === 'female' ? 'pink' : 'blue');
                btn.classList.add(`border-${color}-${btnType === 'uploaded' ? '700' : '500'}`, `ring-${color}-300`, 'ring-2', 'ring-offset-1');
            }
        });

        saveCurrentStudioState(); // Save the selected model type/gender/size/BG
        renderClothingItems(); // Re-render clothing based on gender filtering
    }

    /** Handles the model upload form submission */
    function handleModelUpload(event) {
        event.preventDefault();
        showMessage(uploadModelMessage, "Processing...", false, 0);
        const file = modelFileInput.files?.[0];
        const gender = uploadModelForm.elements.uploadModelGender.value;
        if (!file || !file.type.startsWith('image/')) { showMessage(uploadModelMessage, "Please select a valid image file.", true, 4000); return; }
        if (!gender) { showMessage(uploadModelMessage, "Please select the gender for the model.", true, 4000); return; }
        const maxSizeMB = 5; if (file.size > maxSizeMB * 1024 * 1024) { showMessage(uploadModelMessage, `File size exceeds ${maxSizeMB}MB limit.`, true, 4000); return; }

        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result;
            if (typeof dataUrl === 'string') {
                uploadedModelData = { gender: gender, src: dataUrl };
                saveUploadedModelData(user.email, uploadedModelData);
                updateUploadedModelPreview();
                showMessage(uploadModelMessage, "Model uploaded successfully!", false, 3000);
                // Select the uploaded model, assigning default dimensions
                selectModel({
                    type: 'uploaded',
                    gender: uploadedModelData.gender,
                    src: uploadedModelData.src,
                    name: 'Uploaded Model',
                    defaultHeightCm: DEFAULT_MODEL_HEIGHT_CM, // Assign defaults on upload
                    defaultWeightKg: DEFAULT_MODEL_WEIGHT_KG
                });
                uploadModelForm.reset();
            } else { showMessage(uploadModelMessage, "Error processing file data.", true, 4000); }
        }
        reader.onerror = () => { showMessage(uploadModelMessage, "Error reading the selected file.", true, 4000); }
        reader.readAsDataURL(file);
    }

    /** Updates the appearance of the uploaded model preview button and remove button visibility */
    function updateUploadedModelPreview() {
        if (uploadedModelData && uploadedModelData.src && uploadedModelPreviewBtn && uploadedModelSelectorDiv && removeUploadedModelBtn) { // Added checks
            uploadedModelPreviewBtn.src = uploadedModelData.src;
            uploadedModelPreviewBtn.dataset.gender = uploadedModelData.gender;
            uploadedModelSelectorDiv.classList.remove('hidden');
            removeUploadedModelBtn.classList.remove('hidden'); // Show remove button
        } else if (uploadedModelSelectorDiv && removeUploadedModelBtn) { // Added checks
            uploadedModelSelectorDiv.classList.add('hidden');
            removeUploadedModelBtn.classList.add('hidden'); // Hide remove button
        }
    }

    /** Handles removing the uploaded model */
    function handleRemoveUploadedModel() {
        if (confirm("Are you sure you want to remove your uploaded model?")) {
            deleteUploadedModelData(user.email);
            uploadedModelData = null; // Clear local state
            updateUploadedModelPreview(); // Update UI (hide preview/button)

            // If the removed model was currently selected, switch back to default female
            if (currentModel && currentModel.type === 'uploaded') {
                selectModel(predefinedModels.female);
            }
             showMessage(uploadModelMessage, "Uploaded model removed.", false, 3000);
        }
    }


    // --- Clothing Selection & Filtering ---

    /** Renders clothing items in the grid, filtering by category and model gender */
    function renderClothingItems(filterCategory = 'all') {
        if (!clothingItemGrid || !currentModel) return;
        clothingItemGrid.innerHTML = ''; // Clear previous items
        availableCategories = getUserCategories(user?.email); // Refresh categories { name: type }

        // Filter predefined items
        const itemsToDisplay = predefinedClothingItems.filter(item =>
            (filterCategory === 'all' || item.category === filterCategory) &&
            (item.gender === 'unisex' || item.gender === currentModel.gender)
        );

        if (itemsToDisplay.length === 0) {
            clothingItemGrid.innerHTML = `<p class="text-gray-500 text-sm col-span-full text-center p-4">No items match criteria.</p>`;
            return;
        }

        itemsToDisplay.forEach(item => {
            // Ensure item has a type, defaulting if necessary
            const itemWithType = { ...item, type: getItemType(item), itemType: 'clothing' }; // Add itemType

            const itemDiv = document.createElement('div');
            itemDiv.className = 'clothing-item'; itemDiv.dataset.itemId = item.id;
            const img = document.createElement('img'); img.src = item.src; img.alt = item.name; img.loading = 'lazy';
            img.onerror = () => { img.src = `https://placehold.co/80x80/cccccc/888888?text=${encodeURIComponent(item.category)}`; img.alt = 'Load error'; };
            const nameP = document.createElement('p'); nameP.textContent = item.name; nameP.title = item.name;
            itemDiv.appendChild(img); itemDiv.appendChild(nameP);
            // Add click listener to select the item (passing the item object with type)
            itemDiv.addEventListener('click', () => { selectClothingItem(itemWithType); });
            clothingItemGrid.appendChild(itemDiv);
        });
    }

    /** Renders the category filter buttons */
    function renderCategoryFilters() {
        if (!categoryFiltersContainer) return;
        categoryFiltersContainer.innerHTML = '';
        availableCategories = getUserCategories(user?.email); // Refresh { name: type } map

        // Add "All" filter
        const allBtn = createFilterButton('All', 'all');
        allBtn.classList.add('active', 'bg-blue-500', 'text-white', 'font-semibold');
        categoryFiltersContainer.appendChild(allBtn);

        // Add other category filters (using Object.keys for names)
        Object.keys(availableCategories).sort().forEach(categoryName => {
            categoryFiltersContainer.appendChild(createFilterButton(categoryName, categoryName));
        });
    }

    /** Helper function to create a single category filter button */
    function createFilterButton(text, categoryValue) {
        const button = document.createElement('button');
        button.textContent = text; button.dataset.category = categoryValue;
        button.className = 'category-filter-btn px-3 py-1 border rounded text-xs hover:bg-gray-100 transition duration-150 ease-in-out';
        button.addEventListener('click', () => {
            document.querySelectorAll('.category-filter-btn').forEach(btn => btn.classList.remove('active', 'bg-blue-500', 'text-white', 'font-semibold'));
            button.classList.add('active', 'bg-blue-500', 'text-white', 'font-semibold');
            renderClothingItems(categoryValue); // Re-render clothing grid with the selected filter
        });
        return button;
    }

    // --- Multi-Layer Clothing Adjustment & Display ---

    /** Updates the transform style for a specific overlay (top or bottom) */
    function applyClothingTransform(itemType) {
        const overlayElement = (itemType === 'top') ? clothingOverlayTop : clothingOverlayBottom;
        if (overlayElement && transformState[itemType]) {
            const { scale, x, y, opacity } = transformState[itemType];
            // Apply transform relative to the center
            overlayElement.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${scale})`;
            overlayElement.style.opacity = opacity;
            // Position the overlay absolutely in the center initially
            overlayElement.style.top = '50%';
            overlayElement.style.left = '50%';
            // console.log(`Applied transform to ${itemType}: scale=${scale}, x=${x}, y=${y}, opacity=${opacity}`);
        } else {
            // console.warn(`Cannot apply transform: Missing element or state for ${itemType}`);
        }
    }


    /** Resets the fit controls and the transform state for the specified item type */
    function resetClothingFit(itemType) {
        if (!itemType || !transformState[itemType]) return;
        // console.log(`Resetting fit for ${itemType}`);
        // Reset state object
        transformState[itemType] = { scale: 1, x: 0, y: 0, opacity: 1 };
        // If this is the currently controlled item, reset sliders as well
        if (itemType === lastSelectedItemType) {
            resetSlidersToState(itemType);
        }
        // Apply the reset transform to the overlay immediately
        applyClothingTransform(itemType);
    }

    /** Updates the sliders and value displays based on the state of the last selected item */
    function updateControlsForItem(itemType) {
        if (!itemType || !transformState[itemType] || (itemType === 'top' && !currentTopItem) || (itemType === 'bottom' && !currentBottomItem)) {
            // Hide controls if the type is invalid or the corresponding item is not present
            clothingControlsContainer.classList.add('hidden');
            // console.log("Hiding controls - invalid type or item not present:", itemType);
            return;
        }
        // console.log(`Updating controls for ${itemType}`);
        clothingControlsContainer.classList.remove('hidden');
        adjustingItemTypeSpan.textContent = itemType.charAt(0).toUpperCase() + itemType.slice(1); // Capitalize (Top/Bottom)
        resetSlidersToState(itemType); // Set sliders to match the state of the item being controlled
    }

    /** Helper to set slider values from the transformState object */
    function resetSlidersToState(itemType) {
        const state = transformState[itemType];
        if (!state || !scaleSlider || !xSlider || !ySlider || !opacitySlider || !scaleValueSpan || !xValueSpan || !yValueSpan || !opacityValueSpan) return; // Added checks for elements
        if (scaleSlider) scaleSlider.value = state.scale * 100; if (scaleValueSpan) scaleValueSpan.textContent = Math.round(state.scale * 100);
        if (xSlider) xSlider.value = state.x; if (xValueSpan) xValueSpan.textContent = Math.round(state.x);
        if (ySlider) ySlider.value = state.y; if (yValueSpan) yValueSpan.textContent = Math.round(state.y);
        if (opacitySlider) opacitySlider.value = state.opacity * 100; if (opacityValueSpan) opacityValueSpan.textContent = Math.round(state.opacity * 100);
    }

    /** Handles selecting an item and placing it on the correct layer */
    function selectClothingItem(item) {
        if (!item || !item.src) { console.error("Invalid item selected:", item); return; }

        // Ensure item has a clothing type determined ('top', 'bottom', 'other')
        const itemClothingType = getItemType(item);
        if (!itemClothingType) {
            console.warn("Cannot select item - invalid clothing type:", item);
            return; // Don't process non-clothing items here (like outfits from gallery)
        }
        console.log(`Selecting clothing: ${item.name}, Type: ${itemClothingType}`);

        let targetOverlay = null;
        let itemSlot = null; // 'top' or 'bottom'

        // Determine target overlay and state slot based on type
        if (itemClothingType === 'top') {
            currentTopItem = { ...item, itemType: 'clothing' }; // Store item with its type and itemType
            targetOverlay = clothingOverlayTop;
            itemSlot = 'top';
        } else if (itemClothingType === 'bottom') {
            currentBottomItem = { ...item, itemType: 'clothing' };
            targetOverlay = clothingOverlayBottom;
            itemSlot = 'bottom';
        } else { // 'other' type (e.g., dress) - clears both layers, uses top layer
            console.log("Item type 'other' selected, clearing both layers.");
            clearOutfitLayers(false); // Clear state without confirmation prompt
            currentTopItem = { ...item, itemType: 'clothing' }; // Place 'other' item on top layer
            currentBottomItem = null; // Ensure bottom is clear
            targetOverlay = clothingOverlayTop;
            itemSlot = 'top'; // Controls will affect the top layer
            // Ensure bottom overlay is visually cleared if it wasn't already
            if (clothingOverlayBottom) { clothingOverlayBottom.src = ''; clothingOverlayBottom.style.opacity = 0; clothingOverlayBottom.classList.remove('draggable'); }
        }

        // Set this as the last selected type for controls
        lastSelectedItemType = itemSlot;

        // Reset fit for the specific layer being updated
        resetClothingFit(itemSlot);

        // Update the target overlay image source and make it draggable
        if (targetOverlay) {
            targetOverlay.src = item.src;
            targetOverlay.alt = item.name + " Overlay";
            targetOverlay.classList.add('draggable');
            targetOverlay.style.opacity = 0; // Start hidden for fade-in effect

            // Apply initial (reset) transform and fade in
            // Use setTimeout to allow the opacity change to register for transition
            setTimeout(() => {
                // Double-check if the item is still the one intended for this slot before fading in
                if ((itemSlot === 'top' && currentTopItem?.src === item.src) ||
                    (itemSlot === 'bottom' && currentBottomItem?.src === item.src)) {
                     // Apply transform state (which includes opacity)
                    applyClothingTransform(itemSlot);
                }
            }, 50);
        }

        // *** REMOVED: Side preview update logic ***

        // Update and show controls for the last selected item type
        updateControlsForItem(lastSelectedItemType);

        // Enable/disable buttons based on whether *any* item is selected
        const anyItemSelected = currentTopItem || currentBottomItem;
        if (saveOutfitBtn) saveOutfitBtn.disabled = !anyItemSelected; // Enable save outfit if any clothing is on
        if (getSizeRecBtn) getSizeRecBtn.disabled = !anyItemSelected;
        if (sizeRecOutput) sizeRecOutput.classList.add('hidden'); // Hide previous recommendation
    }

    /** Clears both top and bottom clothing layers and resets state */
    function clearOutfitLayers(confirmUser = true) {
        if (confirmUser && (currentTopItem || currentBottomItem) && !confirm("Clear the current outfit (all layers)?")) {
            return; // User cancelled and there was something to clear
        }
        console.log("Clearing full outfit");

        // Clear state variables
        currentTopItem = null;
        currentBottomItem = null;
        lastSelectedItemType = null;

        // Reset transform states for both layers
        resetClothingFit('top');
        resetClothingFit('bottom');

        // Clear overlay images and make non-draggable
        if (clothingOverlayTop) { clothingOverlayTop.src = ''; clothingOverlayTop.style.opacity = 0; clothingOverlayTop.classList.remove('draggable'); }
        if (clothingOverlayBottom) { clothingOverlayBottom.src = ''; clothingOverlayBottom.style.opacity = 0; clothingOverlayBottom.classList.remove('draggable'); }

        // Hide side preview and controls
        // if (selectedClothingPreview) selectedClothingPreview.classList.add('hidden'); // Removed
        if (clothingControlsContainer) clothingControlsContainer.classList.add('hidden');

        // Clear file input
        if (clothingFileInput) clothingFileInput.value = '';

        // Disable buttons that require an item
        if (saveOutfitBtn) saveOutfitBtn.disabled = true; if (saveOutfitMessage) saveOutfitMessage.classList.add('hidden');
        if (getSizeRecBtn) getSizeRecBtn.disabled = true; if (sizeRecOutput) sizeRecOutput.classList.add('hidden');
    }

    // --- Upload Clothing Modal Logic ---
    function openUploadModal() {
        if (!uploadModal || !uploadCategorySelect || !uploadDetailsForm) return;
        uploadDetailsForm.reset(); // Reset form fields including the new name input
        clearFormStates([uploadDetailsForm]); // Clear any previous validation states
        uploadModalError.classList.add('hidden');
        newCategoryInputContainer?.classList.add('hidden'); // Hide new category fields initially
        populateUploadCategories(); // Populate categories dropdown
        uploadModal.style.display = "block";
    }
    function closeUploadModal() { if (uploadModal) uploadModal.style.display = "none"; }
    function populateUploadCategories() {
        if (!uploadCategorySelect) return;
        uploadCategorySelect.innerHTML = ''; // Clear existing
        availableCategories = getUserCategories(user?.email); // Refresh { name: type } map

        // Add default prompt
        const defaultOption = document.createElement('option'); defaultOption.value = ""; defaultOption.textContent = "-- Select Category --"; defaultOption.disabled = true; defaultOption.selected = true; uploadCategorySelect.appendChild(defaultOption);

        // Add existing categories from the map keys
        Object.keys(availableCategories).sort().forEach(catName => {
            const option = document.createElement('option'); option.value = catName; option.textContent = catName; uploadCategorySelect.appendChild(option);
        });

        // Add "Add New" option
        const addNewOption = document.createElement('option'); addNewOption.value = "add_new"; addNewOption.textContent = "-- Add New Category --"; uploadCategorySelect.appendChild(addNewOption);
    }

    // --- Size Recommendation Logic ---
    function calculateSizeRecommendation() {
        if (!currentTopItem && !currentBottomItem) { return "N/A - Select clothing first."; }

        // --- Placeholder Logic using cm/kg ---
        const { scaleX: modelScaleX, scaleY: modelScaleY } = calculateModelScaleFactors();
        let topScaleFactor = currentTopItem ? transformState.top.scale : 1.0;
        let bottomScaleFactor = currentBottomItem ? transformState.bottom.scale : 1.0;
        let topCategory = currentTopItem?.category;
        let bottomCategory = currentBottomItem?.category;

        // Combine factors (very basic example, needs refinement)
        const avgClothingScale = (currentTopItem && currentBottomItem) ? (topScaleFactor + bottomScaleFactor) / 2 : (currentTopItem ? topScaleFactor : bottomScaleFactor);
        const modelSizeFactor = (modelScaleX + modelScaleY) / 2; // Average model dimension scale factor

        // console.log(`Size Rec Calc: ModelSizeFactor=${modelSizeFactor.toFixed(2)}, AvgClothScale=${avgClothingScale.toFixed(2)}`);

        let size = "M"; // Default
        // Heuristic: If model is scaled up and clothing is scaled down, suggest larger size.
        if (modelSizeFactor > 1.1 && avgClothingScale < 0.95) size = "L";
        // If model is scaled down and clothing is scaled up, suggest smaller size.
        else if (modelSizeFactor < 0.9 && avgClothingScale > 1.05) size = "S";
        // Extreme scaling might suggest XL or XS
        else if (avgClothingScale > 1.5 || modelSizeFactor > 1.3) size = "XL";
        else if (avgClothingScale < 0.6 || modelSizeFactor < 0.7) size = "XS";

        // Adjust for specific categories
        if ((topCategory === 'Outerwear' || bottomCategory === 'Outerwear') && ['XS', 'S'].includes(size)) size = 'M'; // Size up for outerwear

        return `Recommended Size (Estimate): ${size}`;
    }

    // --- *** NEW: Outfit Saving Logic (Canvas) *** ---
    async function saveCurrentOutfit() {
        if (!currentModel || (!currentTopItem && !currentBottomItem) || !activeModelImageElement || !outfitCtx) {
            showMessage(saveOutfitMessage, "Cannot save: Select a model and add clothing first.", true, 3000);
            return;
        }
        if (!activeModelImageElement.complete || activeModelImageElement.naturalWidth === 0) {
             showMessage(saveOutfitMessage, "Cannot save: Model image not fully loaded.", true, 3000);
             return;
        }

        showMessage(saveOutfitMessage, "Generating outfit image...", false, 0); // Show progress
        saveOutfitBtn.disabled = true; // Disable button while saving

        try {
            // 1. Set Canvas Dimensions based on the *natural* size of the model image
            const modelNaturalWidth = activeModelImageElement.naturalWidth;
            const modelNaturalHeight = activeModelImageElement.naturalHeight;
            outfitCanvas.width = modelNaturalWidth;
            outfitCanvas.height = modelNaturalHeight;
            outfitCtx.clearRect(0, 0, outfitCanvas.width, outfitCanvas.height); // Clear canvas

            // 2. Draw Background Color (optional, could make transparent)
            // outfitCtx.fillStyle = currentBackgroundColor;
            // outfitCtx.fillRect(0, 0, outfitCanvas.width, outfitCanvas.height);

            // 3. Draw Model Image (Scaled)
            const { scaleX: modelScaleX, scaleY: modelScaleY } = calculateModelScaleFactors();
            const scaledWidth = modelNaturalWidth * modelScaleX;
            const scaledHeight = modelNaturalHeight * modelScaleY;
            // Draw centered and scaled
            const drawX = (outfitCanvas.width - scaledWidth) / 2;
            const drawY = (outfitCanvas.height - scaledHeight) / 2;
            outfitCtx.drawImage(activeModelImageElement, drawX, drawY, scaledWidth, scaledHeight);

            // 4. Draw Clothing Overlays (Transformed) - Need to load images for canvas drawing
            const drawOverlay = async (item, itemState) => {
                if (!item || !item.src || !itemState) return;

                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => {
                        // --- Calculate drawing parameters based on itemState (scale, x, y) ---
                        // The transform state (x, y) is relative to the overlay's container size.
                        // We need to map this to the canvas coordinates.
                        // The scale is applied relative to the item's natural size.

                        const itemScale = itemState.scale;
                        const itemOpacity = itemState.opacity;

                        // Calculate the scaled size of the clothing item
                        const clothingScaledWidth = img.naturalWidth * itemScale;
                        const clothingScaledHeight = img.naturalHeight * itemScale;

                        // Calculate the center position on the canvas *relative to the model's center*
                        // Model center on canvas: (canvas.width / 2, canvas.height / 2)
                        // The itemState x, y are pixel offsets from the center of the mannequin container.
                        // We need to translate this to the canvas coordinate system.
                        // Assuming the mannequin container and canvas represent the same relative space.
                        const itemCenterX = outfitCanvas.width / 2 + itemState.x;
                        const itemCenterY = outfitCanvas.height / 2 + itemState.y;

                        // Calculate top-left corner for drawing centered item
                        const itemDrawX = itemCenterX - clothingScaledWidth / 2;
                        const itemDrawY = itemCenterY - clothingScaledHeight / 2;

                        // Apply opacity
                        outfitCtx.globalAlpha = itemOpacity;

                        // Draw the image
                        outfitCtx.drawImage(img, itemDrawX, itemDrawY, clothingScaledWidth, clothingScaledHeight);

                        // Reset opacity for next draw
                        outfitCtx.globalAlpha = 1.0;
                        resolve(); // Signal completion
                    };
                    img.onerror = (err) => {
                        console.error("Error loading clothing image for canvas:", item.src, err);
                        reject(new Error(`Failed to load image: ${item.name}`)); // Signal error
                    };
                    // IMPORTANT: Set crossOrigin for tainted canvas if loading from different origins (not needed for data URLs)
                    if (!item.src.startsWith('data:')) {
                         img.crossOrigin = "Anonymous";
                    }
                    img.src = item.src;
                });
            };

            // Draw bottom layer, then top layer
            if (currentBottomItem) await drawOverlay(currentBottomItem, transformState.bottom);
            if (currentTopItem) await drawOverlay(currentTopItem, transformState.top);

            // 5. Export Canvas to Data URL
            const outfitDataUrl = outfitCanvas.toDataURL('image/png'); // Use PNG for transparency support

            // 6. Create Gallery Item Object
            const timestamp = Date.now();
            const outfitItem = {
                id: `outfit_${timestamp}`,
                itemType: 'outfit', // Differentiate from 'clothing'
                name: `Outfit ${new Date(timestamp).toLocaleString()}`,
                src: outfitDataUrl, // The generated image
                createdAt: timestamp,
                // Optional: Store details about what was used
                // modelUsed: { src: currentModel.src, height: currentModelHeightCm, weight: currentModelWeightKg },
                // clothingUsed: { top: currentTopItem, bottom: currentBottomItem }
            };

            // 7. Add to User Gallery
            const added = addToUserGallery(user.email, outfitItem);
            const message = added ? "Outfit saved to Gallery!" : "Outfit already in Gallery.";
            showMessage(saveOutfitMessage, message, !added, 3000); // Show success/already exists message

        } catch (error) {
            console.error("Error saving outfit:", error);
            showMessage(saveOutfitMessage, `Error saving outfit: ${error.message || 'Unknown error'}`, true, 5000);
        } finally {
             saveOutfitBtn.disabled = !(currentTopItem || currentBottomItem); // Re-enable if items exist
        }
    }


    // --- Event Listeners ---

    // Model Controls (Size - cm/kg)
    if (heightSlider && heightValueSpan) {
        heightSlider.addEventListener('input', () => { currentModelHeightCm = parseInt(heightSlider.value, 10); heightValueSpan.textContent = currentModelHeightCm; applyModelScale(); });
        heightSlider.addEventListener('change', saveCurrentStudioState); // Save on release
    }
    if (weightSlider && weightValueSpan) { // Changed from widthSlider
        weightSlider.addEventListener('input', () => {
            currentModelWeightKg = parseInt(weightSlider.value, 10);
            weightValueSpan.textContent = weightSlider.value; // Display value without %
            applyModelScale();
        });
        weightSlider.addEventListener('change', saveCurrentStudioState); // Save on release
    }

    // Model Selection Buttons
    if (modelSelectionArea) { // Added check for modelSelectionArea
        modelSelectionArea.addEventListener('click', (e) => {
            const btn = e.target.closest('.model-select-btn, .uploaded-model-preview'); if (!btn) return;
            const modelType = btn.dataset.modelType;
            if (modelType === 'default') { selectModel(predefinedModels[btn.dataset.gender]); }
            else if (modelType === 'uploaded' && uploadedModelData) {
                 // Select uploaded model, ensuring default dimensions are present
                 selectModel({
                    type: 'uploaded',
                    gender: uploadedModelData.gender,
                    src: uploadedModelData.src,
                    name: 'Uploaded Model',
                    defaultHeightCm: DEFAULT_MODEL_HEIGHT_CM, // Provide defaults
                    defaultWeightKg: DEFAULT_MODEL_WEIGHT_KG
                });
            }
        });
    }


    // Model Upload Form
    if (uploadModelForm) { uploadModelForm.addEventListener('submit', handleModelUpload); }

    // *** NEW: Remove Uploaded Model Button Listener ***
    if (removeUploadedModelBtn) {
        removeUploadedModelBtn.addEventListener('click', handleRemoveUploadedModel);
    }


    // Clothing Selection & Upload Buttons
    if (uploadClothingBtn) { uploadClothingBtn.addEventListener('click', openUploadModal); }
    if (selectGalleryBtn) {
        selectGalleryBtn.addEventListener('click', () => {
            // Set flag to indicate gallery is opened for selection
            sessionStorage.setItem('selectFromGallery', 'true');
            window.location.href = 'gallery.html';
        });
     }

    // Clothing Adjustment Controls (Affects last selected item type)
    function handleSliderInput(slider, valueSpan, stateKey, isScale = false, isOpacity = false) {
        if (!lastSelectedItemType || !transformState[lastSelectedItemType] || !slider || !valueSpan) return; // Ensure layer and elements exist
        let value = isScale || isOpacity ? parseFloat(slider.value) / 100 : parseInt(slider.value, 10);
        // Clamp values if necessary (e.g., opacity between 0 and 1)
        if (isOpacity) value = Math.max(0, Math.min(1, value));
        if (isScale) value = Math.max(0.2, Math.min(3.0, value)); // Allow larger scale range

        transformState[lastSelectedItemType][stateKey] = value; // Update the state object
        if (valueSpan) valueSpan.textContent = slider.value; // Show slider's raw value (e.g., 0-100 for opacity)
        applyClothingTransform(lastSelectedItemType); // Apply the change visually
    }
    if (scaleSlider && scaleValueSpan) { scaleSlider.addEventListener('input', () => handleSliderInput(scaleSlider, scaleValueSpan, 'scale', true)); } // Added checks
    if (xSlider && xValueSpan) { xSlider.addEventListener('input', () => handleSliderInput(xSlider, xValueSpan, 'x')); } // Added checks
    if (ySlider && yValueSpan) { ySlider.addEventListener('input', () => handleSliderInput(ySlider, yValueSpan, 'y')); } // Added checks
    if (opacitySlider && opacityValueSpan) { opacitySlider.addEventListener('input', () => handleSliderInput(opacitySlider, opacityValueSpan, 'opacity', false, true)); } // Added checks
    // Reset button resets the fit for the currently controlled layer
    if (resetClothingBtn) { resetClothingBtn.addEventListener('click', () => { if (lastSelectedItemType) resetClothingFit(lastSelectedItemType); }); }


    // Drag and Drop for Clothing Overlays
    function startDrag(e) {
        draggedOverlayElement = e.target;
        // Determine type ('top' or 'bottom') based on the dragged element's ID
        const type = (draggedOverlayElement.id === clothingOverlayTop?.id) ? 'top' : ((draggedOverlayElement.id === clothingOverlayBottom?.id) ? 'bottom' : null); // Added null checks

        if (!type || (type === 'top' && !currentTopItem) || (type === 'bottom' && !currentBottomItem)) {
            draggedOverlayElement = null; return; // Exit if not a valid overlay or no item is present
        }

        // Switch controls to the dragged item if it wasn't the last selected
        if (lastSelectedItemType !== type) {
            lastSelectedItemType = type; updateControlsForItem(lastSelectedItemType);
        }

        isDragging = true; draggedOverlayElement.classList.add('dragging');
        const eventX = e.pageX || e.touches[0].pageX; const eventY = e.pageY || e.touches[0].pageY;
        startX = eventX; startY = eventY;
        initialX = transformState[lastSelectedItemType].x; initialY = transformState[lastSelectedItemType].y;

        document.addEventListener('mousemove', drag); document.addEventListener('touchmove', drag, { passive: false });
        document.addEventListener('mouseup', endDrag); document.addEventListener('touchend', endDrag);
        if (e.type === 'touchstart') e.preventDefault(); // Prevent page scroll on touch drag
    }
    function drag(e) {
        if (!isDragging || !draggedOverlayElement || !lastSelectedItemType) return;
        if (e.type === 'touchmove') e.preventDefault(); // Prevent page scroll on touch drag
        const currentX = e.pageX || e.touches[0].pageX; const currentY = e.pageY || e.touches[0].pageY;
        const deltaX = currentX - startX; const deltaY = currentY - startY;
        transformState[lastSelectedItemType].x = initialX + deltaX; transformState[lastSelectedItemType].y = initialY + deltaY;
        resetSlidersToState(lastSelectedItemType); applyClothingTransform(lastSelectedItemType);
    }
    function endDrag() {
        if (!isDragging || !draggedOverlayElement) return;
        isDragging = false; draggedOverlayElement.classList.remove('dragging');
        document.removeEventListener('mousemove', drag); document.removeEventListener('touchmove', drag);
        document.removeEventListener('mouseup', endDrag); document.removeEventListener('touchend', endDrag);
        draggedOverlayElement = null;
    }
    // Add drag listeners to both overlays
    if (clothingOverlayTop) { clothingOverlayTop.addEventListener('mousedown', startDrag); clothingOverlayTop.addEventListener('touchstart', startDrag, { passive: false }); }
    if (clothingOverlayBottom) { clothingOverlayBottom.addEventListener('mousedown', startDrag); clothingOverlayBottom.addEventListener('touchstart', startDrag, { passive: false }); }


    // Upload Clothing Modal Listeners
    if (uploadModalCloseBtn) uploadModalCloseBtn.addEventListener('click', closeUploadModal);
    if (uploadModalCancelBtn) uploadModalCancelBtn.addEventListener('click', closeUploadModal);
    if (uploadCategorySelect && newCategoryInputContainer && newCategoryNameInput && newCategoryTypeSelect) { // Added checks
        uploadCategorySelect.addEventListener('change', () => {
            if (uploadCategorySelect.value === 'add_new') {
                newCategoryInputContainer?.classList.remove('hidden');
                newCategoryNameInput?.focus();
                newCategoryTypeSelect.value = ""; // Reset type selection
            } else {
                newCategoryInputContainer?.classList.add('hidden');
            }
        });
    }
    // Handle the submission of the *details* form (gender/category/NAME) in the upload modal
    if (uploadDetailsForm && clothingFileInput && newCategoryTypeSelect && uploadClothingNameInput && uploadCategorySelect && uploadModalError) { // Added checks
        uploadDetailsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            uploadModalError.classList.add('hidden');
            clearFormStates([uploadDetailsForm]); // Clear previous validation states

            let category = uploadCategorySelect.value;
            const gender = uploadDetailsForm.elements.uploadGender.value;
            const clothingName = uploadClothingNameInput.value.trim(); // *** Get Clothing Name ***
            let categoryType = null; // Will hold 'top', 'bottom', or 'other'
            let isValid = true;

            // --- Validation ---
            // *** NEW: Validate Clothing Name ***
            if (!clothingName) {
                setErrorFor(uploadClothingNameInput, "Clothing name cannot be blank");
                showMessage(uploadModalError, "Please enter a name for the clothing.", true, 0);
                isValid = false;
            } else {
                setSuccessFor(uploadClothingNameInput);
            }

            if (!category) {
                setErrorFor(uploadCategorySelect, " "); // Mark as potentially incorrect
                showMessage(uploadModalError, "Please select a category.", true, 0);
                isValid = false;
            } else {
                 setSuccessFor(uploadCategorySelect);
            }

            // Handle "Add New" category selection
            if (category === 'add_new') {
                const newCategoryName = newCategoryNameInput.value.trim();
                const newType = newCategoryTypeSelect.value; // Get selected type

                if (!newCategoryName) {
                    setErrorFor(newCategoryNameInput, "New category name cannot be blank");
                    showMessage(uploadModalError, "Please enter a name for the new category.", true, 0);
                    isValid = false;
                } else {
                     setSuccessFor(newCategoryNameInput);
                }
                if (!newType) {
                    setErrorFor(newCategoryTypeSelect, " ");
                    showMessage(uploadModalError, "Please select a type for the new category.", true, 0);
                    isValid = false;
                } else {
                    setSuccessFor(newCategoryTypeSelect);
                }

                if (isValid) { // Only proceed if new name/type are valid
                    const added = addUserCategory(user?.email, newCategoryName, newType);
                    if (added) {
                         console.log(`New category "${newCategoryName}" (Type: ${newType}) added.`);
                         category = newCategoryName; // Use the new category name
                         categoryType = newType; // Use the selected type
                         populateUploadCategories(); // Refresh dropdown
                         uploadCategorySelect.value = category; // Select the newly added category
                         newCategoryInputContainer?.classList.add('hidden'); // Hide input after adding
                         setSuccessFor(uploadCategorySelect); // Mark main select as success now
                    } else {
                        // Handle case where adding failed (e.g., already exists, error)
                        const existingCategories = getUserCategories(user?.email);
                        if (existingCategories.hasOwnProperty(newCategoryName)) { // Check if it already exists
                            console.log(`Using existing category: ${newCategoryName}`);
                            category = newCategoryName; // Use the existing category
                            categoryType = existingCategories[category]; // Get its type
                            uploadCategorySelect.value = category; // Ensure it's selected
                            newCategoryInputContainer?.classList.add('hidden'); // Hide the input again
                            setSuccessFor(uploadCategorySelect); // Mark main select as success
                        } else {
                            setErrorFor(newCategoryNameInput, "Could not add category");
                            showMessage(uploadModalError, `Could not add category "${newCategoryName}". It might already exist or an error occurred.`, true, 0);
                            isValid = false; // Stop the process
                        }
                    }
                }
            } else if (isValid) { // If not adding new, get type for existing selected category
                availableCategories = getUserCategories(user?.email); // Ensure map is fresh
                categoryType = availableCategories[category] || 'other'; // Default to 'other' if lookup fails
                setSuccessFor(uploadCategorySelect);
            }
             // --- End Validation ---

             if (!isValid) {
                 return; // Stop if validation failed
             }

             // Store selected details temporarily using sessionStorage
             sessionStorage.setItem('uploadMetadata', JSON.stringify({
                 name: clothingName, // Include name
                 category,
                 gender,
                 type: categoryType
             }));

            // Trigger the *hidden* file input click event
            console.log("Triggering clothing file input click...");
            clothingFileInput.click();
        });
    }
    // Listener for the *hidden* clothing file input (fires after user selects a file)
    if (clothingFileInput && uploadModalError && studioSuccessMessage) { // Added checks
        clothingFileInput.addEventListener('change', (event) => {
            const file = event.target.files?.[0];
            const metadataString = sessionStorage.getItem('uploadMetadata');

            if (file && file.type.startsWith('image/') && metadataString) {
                const maxSizeMB = 2; if (file.size > maxSizeMB * 1024 * 1024) { alert(`File size exceeds ${maxSizeMB}MB limit.`); sessionStorage.removeItem('uploadMetadata'); clothingFileInput.value = ''; return; }

                const metadata = JSON.parse(metadataString);
                console.log("Clothing file selected with metadata:", file.name, metadata);

                const reader = new FileReader();
                reader.onload = (e) => {
                    const dataUrl = e.target?.result;
                    if (typeof dataUrl === 'string') {
                        // Create item object including the type and name
                        const uploadedItem = {
                            id: `uploaded_${Date.now()}`, // Mark as uploaded, unique ID
                            itemType: 'clothing', // Mark as clothing item
                            name: metadata.name, // Use the name entered by the user
                            src: dataUrl,
                            category: metadata.category,
                            gender: metadata.gender,
                            type: metadata.type // Include the determined clothing type
                        };

                        // Auto-save to gallery
                        const saved = addToUserGallery(user.email, uploadedItem);
                        if (saved) {
                             showMessage(studioSuccessMessage, "Item uploaded and saved to gallery!", false, 3000);
                        } else {
                             // Show message if it already existed (based on ID)
                             showMessage(studioSuccessMessage, "Item uploaded (already in gallery).", false, 3000);
                        }

                        selectClothingItem(uploadedItem); // Select the newly uploaded item
                        closeUploadModal();
                    } else { console.error("FileReader result was not a string."); alert("Error processing file data."); }
                    sessionStorage.removeItem('uploadMetadata'); clothingFileInput.value = '';
                }
                reader.onerror = () => { alert("Error reading file."); sessionStorage.removeItem('uploadMetadata'); clothingFileInput.value = ''; }
                reader.readAsDataURL(file);
            } else if (file && !metadataString) { alert("Upload process error. Please try again."); clothingFileInput.value = ''; }
            else if (file) { alert("Invalid file type."); sessionStorage.removeItem('uploadMetadata'); clothingFileInput.value = ''; }
            else { console.log("File selection cancelled."); sessionStorage.removeItem('uploadMetadata'); }
        });
    }


    // *** NEW: Save Outfit Button Listener ***
    if (saveOutfitBtn) {
        saveOutfitBtn.addEventListener('click', saveCurrentOutfit);
    }

    // Background Color Picker Listener
    if (bgColorPicker && mannequinContainer) {
        bgColorPicker.addEventListener('input', (e) => {
            currentBackgroundColor = e.target.value;
            mannequinContainer.style.backgroundColor = currentBackgroundColor;
        });
        // Save color change immediately
        bgColorPicker.addEventListener('change', saveCurrentStudioState);
    }

    // Other Buttons
    if (clearOutfitBtn) { clearOutfitBtn.addEventListener('click', () => clearOutfitLayers(true)); }
    if (getSizeRecBtn && sizeRecOutput) { getSizeRecBtn.addEventListener('click', () => { const recommendation = calculateSizeRecommendation(); sizeRecOutput.textContent = recommendation; sizeRecOutput.classList.remove('hidden'); }); }


    // --- Load Initial State ---
    function loadInitialStudioState() {
        console.log("Loading initial studio state (v12)...");
        // 1. Load user's uploaded model data
        uploadedModelData = getUploadedModelData(user.email);
        updateUploadedModelPreview(); // Update UI based on loaded data

        // 2. Render category filters
        renderCategoryFilters();

        // 3. Load last used model state (type, gender, height, weight, background)
        const lastState = getLastStudioState();
        let modelToSelect = null;
        let restoredHeight = null;
        let restoredWeight = null;

        if (lastState) {
             console.log("Restoring last model state:", lastState);
             // Restore Background Color
             currentBackgroundColor = lastState.backgroundColor || DEFAULT_BACKGROUND_COLOR;
             if(mannequinContainer) mannequinContainer.style.backgroundColor = currentBackgroundColor; // Added check
             if(bgColorPicker) bgColorPicker.value = currentBackgroundColor; // Added check

             // *** UPDATED: Restore Height/Weight ***
             restoredHeight = lastState.heightCm;
             restoredWeight = lastState.weightKg;

             // Restore Model
             if (lastState.type === 'uploaded' && uploadedModelData) {
                 modelToSelect = {
                     type: 'uploaded',
                     gender: uploadedModelData.gender,
                     src: uploadedModelData.src,
                     name: 'Uploaded Model',
                     // Assign defaults if missing from old state
                     defaultHeightCm: lastState.defaultHeightCm || DEFAULT_MODEL_HEIGHT_CM,
                     defaultWeightKg: lastState.defaultWeightKg || DEFAULT_MODEL_WEIGHT_KG,
                 };
             }
             else if (lastState.type === 'default' && lastState.gender && predefinedModels[lastState.gender]) {
                 modelToSelect = predefinedModels[lastState.gender];
             }
        } else {
            // Set default background if no state saved
             if(mannequinContainer) mannequinContainer.style.backgroundColor = DEFAULT_BACKGROUND_COLOR; // Added check
             if(bgColorPicker) bgColorPicker.value = DEFAULT_BACKGROUND_COLOR; // Added check
        }

        // Select model (or default if none restored/found)
        if (!modelToSelect) {
            modelToSelect = uploadedModelData ? {
                type: 'uploaded', gender: uploadedModelData.gender, src: uploadedModelData.src, name: 'Uploaded Model',
                defaultHeightCm: DEFAULT_MODEL_HEIGHT_CM, defaultWeightKg: DEFAULT_MODEL_WEIGHT_KG // Assign defaults
            } : predefinedModels.female;
        }
        selectModel(modelToSelect); // Selects model, sets default size, renders clothing

        // Apply saved size *after* selecting model (overriding the default set by selectModel)
        if (restoredHeight !== null && heightSlider && heightValueSpan) { currentModelHeightCm = restoredHeight; heightSlider.value = currentModelHeightCm; heightValueSpan.textContent = currentModelHeightCm; } // Added null check and element checks
        // Apply saved weight *after* selecting model (overriding the default set by selectModel) - Update display without %
        if (restoredWeight !== null && weightSlider && weightValueSpan) { currentModelWeightKg = restoredWeight; weightSlider.value = currentModelWeightKg; weightValueSpan.textContent = currentModelWeightKg; } // Added null check and element checks

        applyModelScale(); // Apply the potentially restored scale

        // 4. Check for gallery selection (item SRC is passed)
        const selectedGalleryItemSrc = sessionStorage.getItem('selectedGalleryItem');
        clearOutfitLayers(false); // Start with clean clothing layers

        if (selectedGalleryItemSrc) {
            console.log("Loading item from gallery selection (src):", selectedGalleryItemSrc);
            const galleryItems = getUserGallery(user?.email); // Get array of item objects
            // Find the item by SRC - NOTE: This won't work for saved outfits which use data URLs.
            // Gallery selection should ideally pass the item ID. For now, only clothing items can be selected this way.
            const itemFromGallery = galleryItems.find(i => i && i.itemType === 'clothing' && i.src === selectedGalleryItemSrc);
            if (itemFromGallery) {
                selectClothingItem(itemFromGallery); // Select the clothing item object from gallery
            } else { console.warn("Could not find gallery *clothing* item object for src:", selectedGalleryItemSrc); }
            sessionStorage.removeItem('selectedGalleryItem'); sessionStorage.removeItem('selectFromGallery');
        } else {
             console.log("No gallery item selection found.");
             // Ensure outfit is clear if nothing else loaded
             clearOutfitLayers(false);
        }

        // 5. Set initial button states based on whether any clothing is selected
        const anyItemSelected = currentTopItem || currentBottomItem;
        if(saveOutfitBtn) saveOutfitBtn.disabled = !anyItemSelected;
        if(getSizeRecBtn) getSizeRecBtn.disabled = !anyItemSelected;
        if (!anyItemSelected && clothingControlsContainer) { clothingControlsContainer.classList.add('hidden'); }
        if (!anyItemSelected && sizeRecOutput) { sizeRecOutput.classList.add('hidden'); }

        console.log("Initial studio state loaded (v12).");
    }

    /** Saves the current model state (type, gender, height, weight, background) to localStorage */
    function saveCurrentStudioState() {
        if (!currentModel) return;
        const state = {
            type: currentModel.type,
            gender: currentModel.gender,
            heightCm: currentModelHeightCm, // *** Save cm ***
            weightKg: currentModelWeightKg, // *** Save kg ***
            // Save defaults too, in case model definition changes later
            defaultHeightCm: currentModel.defaultHeightCm || DEFAULT_MODEL_HEIGHT_CM,
            defaultWeightKg: currentModel.defaultWeightKg || DEFAULT_MODEL_WEIGHT_KG,
            backgroundColor: currentBackgroundColor // Save background color
        };
        saveLastStudioState(state);
        // console.log("Studio state saved:", state);
    }

    // --- Initial Load Execution ---
    loadInitialStudioState();

} // End initStudioPage


/**
 * Initializes the My Gallery page (Handles clothing items and outfit objects).
 */
function initGalleryPage() {
    console.log("Initializing Gallery Page (v8 - Handles Outfits)");
    requireLogin();
    const user = getLoggedInUser(); if (!user) { console.error("Gallery page: User not found."); handleLogout(); return; }
    const galleryContainer = document.getElementById('gallery-items-container');
    const emptyMessage = document.getElementById('gallery-empty-message');
    // Check if gallery is opened for selecting an item to use in the studio
    const isSelectingForStudio = sessionStorage.getItem('selectFromGallery') === 'true';

    if (!galleryContainer || !emptyMessage) { console.error("Gallery container or empty message element missing!"); return; }

    function renderGallery() {
        galleryContainer.innerHTML = '';
        const galleryItems = getUserGallery(user.email); // Gets array of {src, name, ..., itemType: 'clothing'|'outfit', id: ...}

        if (galleryItems.length === 0) { emptyMessage.classList.remove('hidden'); galleryContainer.classList.add('hidden'); }
        else {
            emptyMessage.classList.add('hidden'); galleryContainer.classList.remove('hidden');
            // Sort items, maybe newest first? (Optional)
            galleryItems.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); // Sort by creation time if available

            galleryItems.forEach(item => {
                if (!item || !item.src || !item.id) return; // Skip invalid items

                const itemId = item.id; // Use ID for actions
                const itemSrc = item.src; // src is image data (URL or dataURL)
                const itemName = item.name || (item.itemType === 'outfit' ? 'Saved Outfit' : 'Gallery Item');
                const itemType = item.itemType || 'clothing'; // Default to clothing if missing

                const itemDiv = document.createElement('div');
                itemDiv.className = 'gallery-item group relative border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow duration-200 flex flex-col'; // Use flex-col

                const img = document.createElement('img');
                img.src = itemSrc;
                img.alt = itemName;
                // *** Adjust styling based on type for better display ***
                img.className = `w-full h-40 object-contain p-2 ${itemType === 'outfit' ? 'bg-gray-200' : 'bg-gray-50'}`; // Different BG for outfits?
                img.loading = 'lazy';
                img.onerror = () => { img.src = 'https://placehold.co/150x150/cccccc/888888?text=Load%20Error'; img.classList.add('opacity-50'); };

                // Add item name below image
                const nameP = document.createElement('p');
                nameP.textContent = itemName;
                nameP.title = itemName;
                nameP.className = 'text-xs text-center p-1 bg-gray-100 truncate mt-auto'; // Use mt-auto to push to bottom

                // Overlay for actions
                const overlayDiv = document.createElement('div');
                overlayDiv.className = 'absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity duration-200 flex items-center justify-center space-x-2 p-2 opacity-0 group-hover:opacity-100';

                // "Use" button - ONLY for CLOTHING items if selecting for studio
                if (isSelectingForStudio && itemType === 'clothing') {
                    const useBtn = document.createElement('button');
                    useBtn.innerHTML = '<i class="fas fa-check mr-1"></i> Use';
                    useBtn.title = "Use clothing in studio";
                    useBtn.className = 'use-item-btn bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium py-1 px-3 rounded transition duration-150 ease-in-out';
                    // Pass the SRC back to the studio page (studio will find the full object)
                    // NOTE: Passing ID would be more robust if gallery items change.
                    useBtn.addEventListener('click', (e) => { e.stopPropagation(); selectClothingItemAndReturn(itemSrc); });
                    overlayDiv.appendChild(useBtn);
                }

                // Delete button (for both types)
                const deleteBtn = document.createElement('button');
                deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
                deleteBtn.title = "Delete Item";
                deleteBtn.className = 'delete-item-btn bg-red-500 hover:bg-red-600 text-white text-xs font-medium py-1 px-2 rounded transition duration-150 ease-in-out';
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm(`Delete "${itemName}"?`)) {
                        removeFromUserGallery(user.email, itemId); // Remove by ID
                        renderGallery(); // Re-render
                    }
                });
                overlayDiv.appendChild(deleteBtn);

                itemDiv.appendChild(img);
                itemDiv.appendChild(nameP); // Add name below image
                itemDiv.appendChild(overlayDiv);

                // Make clothing items clickable if selecting for studio
                if (isSelectingForStudio && itemType === 'clothing') {
                    itemDiv.style.cursor = 'pointer';
                    itemDiv.addEventListener('click', () => selectClothingItemAndReturn(itemSrc));
                }

                galleryContainer.appendChild(itemDiv);
            });
        }
    }
    // Selects CLOTHING item by SRC and returns to studio
    function selectClothingItemAndReturn(itemSrc) {
        sessionStorage.setItem('selectedGalleryItem', itemSrc); // Pass src
        sessionStorage.removeItem('selectFromGallery'); // Clear the selection mode flag
        window.location.href = 'studio.html';
    }

    renderGallery(); // Initial render

    // Clear selection mode if user navigates away without selecting
    window.addEventListener('beforeunload', () => {
        if (sessionStorage.getItem('selectFromGallery') === 'true') {
            console.log("Leaving gallery page without selecting clothing.");
            sessionStorage.removeItem('selectFromGallery');
        }
    });
}


// --- Global Event Listeners ---
document.body.addEventListener('click', function(event) { if (event.target.closest('.password-toggle-icon')) { togglePasswordVisibility(event); } });
document.addEventListener('DOMContentLoaded', () => { const logoutButton = document.getElementById('nav-logout'); if (logoutButton) { logoutButton.addEventListener('click', (e) => { e.preventDefault(); if (confirm("Are you sure you want to logout?")) { handleLogout(); } }); } });

// --- Page Initialization Router ---
document.addEventListener('DOMContentLoaded', () => {
    const pageId = document.body.id;
    console.log(`--- Initializing page: ${pageId} ---`);
    try {
        switch (pageId) {
            case 'login-page': initLoginPage(); break;
            case 'forgot-password-page': initForgotPasswordPage(); break;
            case 'account-page': initAccountPage(); break;
            case 'studio-page': initStudioPage(); break; // Calls the updated v12 function
            case 'gallery-page': initGalleryPage(); break; // Calls the updated v8 function
            default:
                console.warn("No specific init function for page ID:", pageId);
                // Add login check for any other authenticated page
                const header = document.getElementById('main-header');
                if(header && pageId !== 'login-page' && pageId !== 'forgot-password-page') {
                    requireLogin();
                }
                break;
        }
    } catch (error) {
        console.error(`Critical error during page initialization for ${pageId}:`, error);
        // Display a user-friendly message on the page if possible
        const errorDisplay = document.getElementById('studio-error-message') || document.body;
        if (errorDisplay) {
            errorDisplay.textContent = "A critical error occurred while loading the page. Please try refreshing.";
            if (errorDisplay.classList) errorDisplay.classList.remove('hidden');
        }
     }
    console.log(`--- Page init complete: ${pageId} ---`);
});
