document.addEventListener('DOMContentLoaded', function() {
    // Global variables
    let currentApp = null;
    
    // Initialize all apps
    initImageCompressor();
    initPdfToJpg();
    initPdfToWord();
    
    // Set up event listeners for app cards
    const appCards = document.querySelectorAll('.app-card');
    const appContainers = document.querySelectorAll('.app-container');
    const backButtons = document.querySelectorAll('.back-btn');
    
    // Show app when card is clicked
    appCards.forEach(card => {
        card.addEventListener('click', function(e) {
            // Don't trigger if the click was on the button (handled separately)
            if (e.target.classList.contains('open-app-btn')) return;
            
            const appId = this.id;
            showApp(appId);
        });
    });
    
    // Also handle button clicks specifically
    const openAppButtons = document.querySelectorAll('.open-app-btn');
    openAppButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const appId = this.getAttribute('data-app');
            showApp(appId);
        });
    });
    
    // Back button functionality
    backButtons.forEach(button => {
        button.addEventListener('click', function() {
            hideCurrentApp();
        });
    });
    
    // Function to show an app
    function showApp(appId) {
        // Hide all apps first
        appContainers.forEach(container => {
            container.style.display = 'none';
        });
        
        // Show the selected app
        const appContainer = document.getElementById(`${appId}-container`);
        if (appContainer) {
            appContainer.style.display = 'block';
            currentApp = appId;
            
            // Scroll to the app container
            appContainer.scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    // Function to hide the current app
    function hideCurrentApp() {
        if (currentApp) {
            const appContainer = document.getElementById(`${currentApp}-container`);
            if (appContainer) {
                appContainer.style.display = 'none';
            }
            currentApp = null;
            
            // Scroll back to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
    
    // Image Compressor App
    function initImageCompressor() {
        const uploadArea = document.getElementById('image-upload-area');
        const imageInput = document.getElementById('image-input');
        const qualityRange = document.getElementById('quality-range');
        const qualityValue = document.getElementById('quality-value');
        const originalImage = document.getElementById('original-image');
        const compressedImage = document.getElementById('compressed-image');
        const originalSize = document.getElementById('original-size');
        const compressedSize = document.getElementById('compressed-size');
        const resultArea = document.getElementById('image-result-area');
        const downloadBtn = document.getElementById('download-compressed-btn');
        
        let originalFile = null;
        let compressedBlob = null;
        
        // Update quality value display
        qualityRange.addEventListener('input', function() {
            qualityValue.textContent = this.value;
        });
        
        // Handle file selection
        imageInput.addEventListener('change', function(e) {
            if (e.target.files.length) {
                originalFile = e.target.files[0];
                processImage(originalFile);
            }
        });
        
        // Drag and drop functionality
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', function() {
            this.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
            
            if (e.dataTransfer.files.length) {
                originalFile = e.dataTransfer.files[0];
                processImage(originalFile);
            }
        });
        
        // Process the image
        function processImage(file) {
            if (!file.type.match('image.*')) {
                alert('Please select an image file.');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                // Display original image
                originalImage.src = e.target.result;
                originalSize.textContent = `Size: ${formatFileSize(file.size)}`;
                
                // Create compressed version
                createCompressedImage(e.target.result, parseInt(qualityRange.value));
            };
            reader.readAsDataURL(file);
        }
        
        // Create compressed image
        function createCompressedImage(imageSrc, quality) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Calculate new dimensions (optional: you could add resizing here)
                canvas.width = img.width;
                canvas.height = img.height;
                
                // Draw image on canvas
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                // Convert to blob with specified quality
                canvas.toBlob(function(blob) {
                    compressedBlob = blob;
                    compressedImage.src = URL.createObjectURL(blob);
                    compressedSize.textContent = `Size: ${formatFileSize(blob.size)} (${Math.round((1 - blob.size / originalFile.size) * 100)}% smaller)`;
                    
                    // Show result area
                    resultArea.classList.remove('hidden');
                }, 'image/jpeg', quality / 100);
            };
            img.src = imageSrc;
        }
        
        // Download compressed image
        downloadBtn.addEventListener('click', function() {
            if (compressedBlob) {
                const url = URL.createObjectURL(compressedBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `compressed_${originalFile.name.replace(/\.[^/.]+$/, '')}.jpg`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        });
        
        // Update compression when quality changes
        qualityRange.addEventListener('change', function() {
            if (originalImage.src && originalImage.src !== '') {
                createCompressedImage(originalImage.src, parseInt(this.value));
            }
        });
    }
    
    // PDF to JPG App
    function initPdfToJpg() {
        const uploadArea = document.getElementById('pdf-upload-area');
        const pdfInput = document.getElementById('pdf-input');
        const pageRangeSelect = document.getElementById('pdf-page-range');
        const customRangeInputs = document.getElementById('custom-range-inputs');
        const jpgQuality = document.getElementById('jpg-quality');
        const jpgQualityValue = document.getElementById('jpg-quality-value');
        const resultArea = document.getElementById('pdf-to-jpg-result');
        const previewContainer = document.getElementById('jpg-preview-container');
        const downloadAllBtn = document.getElementById('download-all-jpgs-btn');
        
        let pdfFile = null;
        let pdfImages = [];
        
        // Update quality value display
        jpgQuality.addEventListener('input', function() {
            jpgQualityValue.textContent = this.value;
        });
        
        // Show/hide custom range inputs
        pageRangeSelect.addEventListener('change', function() {
            if (this.value === 'custom') {
                customRangeInputs.classList.remove('hidden');
            } else {
                customRangeInputs.classList.add('hidden');
            }
        });
        
        // Handle file selection
        pdfInput.addEventListener('change', function(e) {
            if (e.target.files.length) {
                pdfFile = e.target.files[0];
                processPdf(pdfFile);
            }
        });
        
        // Drag and drop functionality
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', function() {
            this.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
            
            if (e.dataTransfer.files.length) {
                pdfFile = e.dataTransfer.files[0];
                processPdf(pdfFile);
            }
        });
        
        // Process PDF file
        async function processPdf(file) {
            if (!file.type.match('application/pdf') && !file.name.match(/\.pdf$/i)) {
                alert('Please select a PDF file.');
                return;
            }
            
            // Clear previous results
            previewContainer.innerHTML = '';
            pdfImages = [];
            resultArea.classList.add('hidden');
            
            // Show loading state
            previewContainer.innerHTML = '<p>Loading PDF... This may take a moment.</p>';
            
            try {
                const pdfData = await readFileAsArrayBuffer(file);
                const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
                const totalPages = pdf.numPages;
                
                // Determine which pages to convert
                let pagesToConvert = [];
                if (pageRangeSelect.value === 'all') {
                    pagesToConvert = Array.from({ length: totalPages }, (_, i) => i + 1);
                } else {
                    const start = parseInt(document.getElementById('start-page').value) || 1;
                    const end = parseInt(document.getElementById('end-page').value) || totalPages;
                    pagesToConvert = Array.from({ length: Math.min(end, totalPages) - start + 1 }, (_, i) => start + i);
                }
                
                // Convert each page
                previewContainer.innerHTML = '';
                for (const pageNum of pagesToConvert) {
                    if (pageNum < 1 || pageNum > totalPages) continue;
                    
                    try {
                        const page = await pdf.getPage(pageNum);
                        const viewport = page.getViewport({ scale: 1.5 });
                        
                        // Create canvas for this page
                        const canvas = document.createElement('canvas');
                        const context = canvas.getContext('2d');
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;
                        
                        // Render PDF page to canvas
                        await page.render({
                            canvasContext: context,
                            viewport: viewport
                        }).promise;
                        
                        // Convert to JPG
                        const quality = parseInt(jpgQuality.value) / 100;
                        canvas.toBlob(function(blob) {
                            const jpgUrl = URL.createObjectURL(blob);
                            pdfImages.push({
                                pageNum,
                                blob,
                                url: jpgUrl
                            });
                            
                            // Create preview
                            const preview = document.createElement('div');
                            preview.className = 'jpg-preview';
                            preview.innerHTML = `
                                <img src="${jpgUrl}" alt="Page ${pageNum}">
                                <p>Page ${pageNum}</p>
                                <a href="${jpgUrl}" download="page_${pageNum}.jpg">Download</a>
                            `;
                            previewContainer.appendChild(preview);
                            
                            // Show result area if not already shown
                            if (!resultArea.classList.contains('hidden')) return;
                            if (pdfImages.length === pagesToConvert.length) {
                                resultArea.classList.remove('hidden');
                            }
                        }, 'image/jpeg', quality);
                        
                    } catch (error) {
                        console.error(`Error processing page ${pageNum}:`, error);
                        // Add error message to preview
                        const errorDiv = document.createElement('div');
                        errorDiv.className = 'jpg-preview';
                        errorDiv.innerHTML = `<p>Error converting page ${pageNum}</p>`;
                        previewContainer.appendChild(errorDiv);
                    }
                }
                
            } catch (error) {
                console.error('Error processing PDF:', error);
                previewContainer.innerHTML = '<p class="error">Error processing PDF file. Please try another file.</p>';
            }
        }
        
        // Download all as ZIP
        downloadAllBtn.addEventListener('click', async function() {
            if (pdfImages.length === 0) return;
            
            const zip = new JSZip();
            const folder = zip.folder('pdf_images');
            
            // Add each image to the zip
            pdfImages.forEach(img => {
                folder.file(`page_${img.pageNum}.jpg`, img.blob);
            });
            
            // Generate the zip file
            const content = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(content);
            
            // Create download link
            const a = document.createElement('a');
            a.href = url;
            a.download = `pdf_images_${pdfFile.name.replace(/\.[^/.]+$/, '')}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }
    
    // PDF to Word App
    function initPdfToWord() {
        const uploadArea = document.getElementById('pdf-word-upload-area');
        const pdfInput = document.getElementById('pdf-word-input');
        const resultArea = document.getElementById('pdf-to-word-result');
        const downloadBtn = document.getElementById('download-word-btn');
        
        // Handle file selection
        pdfInput.addEventListener('change', function(e) {
            if (e.target.files.length) {
                processPdfToWord(e.target.files[0]);
            }
        });
        
        // Drag and drop functionality
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', function() {
            this.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
            
            if (e.dataTransfer.files.length) {
                processPdfToWord(e.dataTransfer.files[0]);
            }
        });
        
        // Process PDF to Word conversion
        async function processPdfToWord(file) {
            if (!file.type.match('application/pdf') && !file.name.match(/\.pdf$/i)) {
                alert('Please select a PDF file.');
                return;
            }
            
            // Show loading state
            resultArea.classList.add('hidden');
            uploadArea.innerHTML = '<p>Processing PDF... This may take a moment.</p>';
            
            try {
                // Note: Actual PDF to Word conversion in pure JS is very limited
                // This is a simplified approach that extracts text and creates a simple Word doc
                
                const pdfData = await readFileAsArrayBuffer(file);
                const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
                let textContent = '';
                
                // Extract text from each page
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const text = await page.getTextContent();
                    textContent += text.items.map(item => item.str).join(' ') + '\n\n';
                }
                
                // Create a simple Word document (as plain text for this demo)
                // In a real app, you'd use a library to create proper .docx files
                const blob = new Blob([textContent], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                
                // Set up download link
                downloadBtn.href = url;
                downloadBtn.download = `${file.name.replace(/\.[^/.]+$/, '')}.docx`;
                
                // Show result area
                uploadArea.innerHTML = `
                    <i class="fas fa-cloud-upload-alt"></i>
                    <p>Drag & drop your PDF here or click to browse</p>
                `;
                resultArea.classList.remove('hidden');
                
            } catch (error) {
                console.error('Error converting PDF to Word:', error);
                uploadArea.innerHTML = `
                    <i class="fas fa-cloud-upload-alt"></i>
                    <p>Drag & drop your PDF here or click to browse</p>
                    <p class="error">Error processing PDF file. Please try another file.</p>
                `;
            }
        }
    }
    
    // Helper function to read file as ArrayBuffer
    function readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }
    
    // Helper function to format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
});
