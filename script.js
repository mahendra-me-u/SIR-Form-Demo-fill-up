// script.js
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('voterForm');
    const qrPlaceholder = document.getElementById('qr-placeholder');
    const qrCanvas = document.getElementById('qr-canvas');
    const photoUpload = document.getElementById('photo-upload');
    const photoPreview = document.getElementById('photo-preview');
    const photoPlaceholder = document.getElementById('photo-placeholder');
    let qrGenerated = false;
    let globalUniqueId = '';  // Make QR ID globally accessible

    // Generate unique QR code using the correct library API
    function generateQR() {
        if (qrGenerated) return;
        const uniqueId = 'SIR-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        globalUniqueId = uniqueId;  // Store globally
        try {
            if (typeof QRCode === 'undefined') {
                throw new Error('QRCode library not loaded');
            }
            // Use constructor for davidshimjs/qrcodejs library
            new QRCode(qrCanvas, {
                text: uniqueId,
                width: 150,
                height: 150,
                colorDark: '#000',
                colorLight: '#fff',
                correctLevel: QRCode.CorrectLevel.M  // Medium error correction
            });
            qrPlaceholder.style.display = 'none';
            qrCanvas.style.display = 'block';
            qrGenerated = true;
            console.log('Generated QR for ID: ' + uniqueId);
        } catch (error) {
            console.error('QR Generation Error:', error);
            qrPlaceholder.innerHTML = 'QR Code Error - Check console (F12)';
            globalUniqueId = 'Error - No ID Generated';
        }
    }

    // Load QR on DOM ready
    generateQR();

    // Photo upload preview
    photoUpload.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                photoPreview.src = e.target.result;
                photoPreview.style.display = 'block';
                photoPlaceholder.style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
    });

    // Form submission
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        console.log('Submit triggered');
        // Enhanced validation
        const mobile = document.getElementById('mobile').value.trim();
        const dob = document.getElementById('dob').value;
        const mobileNum = mobile.replace(/\D/g, '');  // Strip all non-digits (handles +91 spaces)
        if (mobileNum.length !== 10 || !dob) {
            alert('মোবাইল নম্বর ১০ ডিজিটের হতে হবে এবং জন্ম তারিখ পূরণ করুন!\nPlease enter a valid 10-digit mobile number and date of birth!');
            return;
        }
        // Collect form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        console.log('Form Data:', data);
        console.log('QR ID:', globalUniqueId);  // Debug log
        // Simulate submission
        alert('ফর্ম সফলভাবে জমা দেওয়া হয়েছে!\nForm ID: ' + globalUniqueId + '\n\nForm submitted successfully!');
    });

    // Reset form
    const resetBtn = document.querySelector('.btn-reset');
    resetBtn.addEventListener('click', function (e) {
        e.preventDefault();
        form.reset();
        // Clear all inputs including info-section
        document.querySelectorAll('input[type="text"], input[type="tel"], input[type="date"], input[type="number"]').forEach(input => input.value = '');
        // Reset photo
        photoPreview.style.display = 'none';
        photoPlaceholder.style.display = 'flex';
        photoUpload.value = '';
        // Reset QR
        qrPlaceholder.style.display = 'flex';
        qrCanvas.style.display = 'none';
        qrPlaceholder.innerHTML = 'QR Code';  // Reset placeholder text
        qrGenerated = false;
        globalUniqueId = '';  // Clear ID
        setTimeout(generateQR, 100); // Delay to ensure reset
    });

    // Print function
    window.printForm = function () {
        console.log('Print triggered');
        window.print();
    };

    // Auto-format Aadhaar
    document.getElementById('aadhaar').addEventListener('input', function (e) {
        let value = e.target.value.replace(/\D/g, '').replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2-$3');
        e.target.value = value.substring(0, 14);
    });

    // Mobile number format
  document.getElementById('mobile').addEventListener('input', function (e) {
    let value = e.target.value.replace(/\D/g, '');  // removes everything except digits
    if (value.length > 10) value = value.substring(0, 10);
    if (value.length >= 6) {
        value = '+91 ' + value.substring(0, 5) + ' ' + value.substring(5);
    } else {
        value = '+91 ' + value;
    }
    e.target.value = value;
});

    // DOB input as date (browser handles it)
    document.getElementById('dob').addEventListener('input', function (e) {
        // No additional formatting needed
    });
});
