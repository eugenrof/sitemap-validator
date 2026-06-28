// --- Environment Detection & Proxy Configuration ---
const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const PROXY_URL = IS_LOCAL 
    ? 'http://localhost:8010/proxy/' 
    : 'https://corsproxy.io/?';

// --- Helper to fetch through proxy ---
async function proxyFetch(url) {
    if (IS_LOCAL) {
        return await fetch(PROXY_URL + url);
    }

    const proxies = [
        'https://corsproxy.io/?',
        'https://api.allorigins.win/raw?url=',
        'https://thingproxy.freeboard.io/fetch/',
        'https://proxy.cors.sh/',
        'https://api.codetabs.com/v1/proxy?quest=',
        'https://crossorigin.me/',
        'https://cors-anywhere.herokuapp.com/', 
        'https://api.allorigins.run/raw?url=',
        'https://proxy.scrapeops.io/v1/?url=',
        'https://api.scraperapi.com/?api_key=YOUR_KEY&url='
    ];

    for (const proxy of proxies) {
        try {
            const response = await fetch(proxy + encodeURIComponent(url));
            if (response.ok) {
                return response;
            }
        } catch (err) {
            console.warn(`Proxy ${proxy} failed, trying next...`);
            continue; 
        }
    }
    throw new Error('All proxy fallbacks exhausted. Target endpoint unreachable.');
}

// --- Split Resizer Interaction Logic ---
const resizer = document.getElementById('dragResizer');
const leftPanel = document.getElementById('leftPanel');
const container = document.getElementById('splitContainer');

resizer.addEventListener('mousedown', initDrag);

function initDrag(e) {
    e.preventDefault();
    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
}

function doDrag(e) {
    if (window.innerWidth > 768) {
        const containerRect = container.getBoundingClientRect();
        const newWidth = e.clientX - containerRect.left;
        
        if (newWidth > 200 && newWidth < (containerRect.width - 200)) {
            leftPanel.style.width = `${newWidth}px`;
        }
    }
}

function stopDrag() {
    document.removeEventListener('mousemove', doDrag);
    document.removeEventListener('mouseup', stopDrag);
}

// --- Accessibility (WCAG) Form Interaction Additions ---
document.getElementById('sitemapUrl').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        startScan();
    }
});

// --- Application Core Operational Tasks ---
async function startScan() {
    const sitemapUrl = document.getElementById('sitemapUrl').value.trim();
    const statusIndicator = document.getElementById('statusIndicator');
    const resultsBody = document.getElementById('resultsBody');
    const scanBtn = document.getElementById('scanBtn');
    const pdfBtn = document.getElementById('pdfBtn');

    if (!sitemapUrl) {
        alert('Please assign a targeted sitemap link.');
        return;
    }

    resultsBody.innerHTML = '';
    scanBtn.disabled = true;
    if (pdfBtn) pdfBtn.disabled = true;

    // --- UPDATED: Visual Loading State ---
    statusIndicator.innerHTML = `
        <span class="spinner"></span> 
        <span>📡 Analyzing Sitemap Data...</span>
    `;

    try {
        const response = await proxyFetch(sitemapUrl);
        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");
        
        let locElements = xmlDoc.getElementsByTagName("loc");
        if (locElements.length === 0) locElements = xmlDoc.querySelectorAll("loc");

        const urls = [];
        for (let i = 0; i < locElements.length; i++) {
            urls.push(locElements[i].textContent.trim());
        }

        if (urls.length === 0) throw new Error('Zero URLs identified inside target schema.');

        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            // Update indicator during the loop for active feedback
            statusIndicator.innerHTML = `<span class="spinner"></span> <span>⏳ Parsing indices (${i + 1}/${urls.length}): ${url}</span>`;
            
            let statusCode = 'ERR';
            let statusText = 'Connection Failed';
            let rowClass = 'status-error';

            try {
                const res = await proxyFetch(url);
                statusCode = res.status;
                statusText = res.ok ? 'OK' : 'Link Flagged';
                rowClass = res.ok ? 'status-200' : 'status-error';
            } catch (err) { 
                statusText = err.message || 'Connection Failed';
            }

            const row = `<tr>
                <td><a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a></td>
                <td class="${rowClass}">${statusCode}</td>
                <td>${statusText}</td>
            </tr>`;
            resultsBody.insertAdjacentHTML('beforeend', row);
        }

        statusIndicator.innerText = `✅ Extraction finished. Monitored ${urls.length} locations.`;
        if (pdfBtn) pdfBtn.disabled = false;

    } catch (error) {
        statusIndicator.innerText = `❌ Error encounter: ${error.message}`;
        if (pdfBtn && resultsBody.querySelectorAll('tr:not(.table-empty-row)').length === 0) pdfBtn.disabled = true;
    } finally {
        scanBtn.disabled = false;
    }
}

// --- Management Toolbar Controls ---
function clearResults() {
    const resultsBody = document.getElementById('resultsBody');
    const pdfBtn = document.getElementById('pdfBtn');

    document.getElementById('sitemapUrl').value = '';
    
    resultsBody.innerHTML = `
        <tr class="table-empty-row">
            <td colspan="3">
                <div class="empty-placeholder-card">
                    <div class="placeholder-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                            <line x1="12" y1="22.08" x2="12" y2="12"></line>
                        </svg>
                    </div>
                    <h3>Awaiting Target Discovery Stream</h3>
                    <p>No real-time URL execution paths have been extracted yet.</p>
                </div>
            </td>
        </tr>
    `;
    
    document.getElementById('statusIndicator').innerText = 'Ready to scan';
    if (pdfBtn) pdfBtn.disabled = true;
}

async function downloadPDF() {
    const tableRows = document.querySelectorAll('#resultsBody tr:not(.table-empty-row)');
    const totalLinks = tableRows.length;
    
    if (totalLinks === 0) {
        alert('No metrics data available to export. Run a successful scan first.');
        return;
    }

    const statusIndicator = document.getElementById('statusIndicator');
    const originalStatus = statusIndicator.innerText;
    statusIndicator.innerText = '⚙️ Generating native data vector stream...';

    if (!window.jspdf) {
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    
    let currentY = 20;

    doc.setFillColor(233, 236, 239);
    doc.rect(margin, currentY, pageWidth - (margin * 2), 22, 'F');
    doc.setDrawColor(16, 124, 65);
    doc.setLineWidth(1);
    doc.line(margin, currentY, margin, currentY + 22);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(73, 80, 87);
    doc.text("SITEMAP AUTOMATION WORKSPACE REPORT METRICS SUMMARY", margin + 5, currentY + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(13);
    doc.setTextColor(33, 37, 41);
    doc.text(`Total Evaluated Target Links: `, margin + 5, currentY + 14);
    doc.setFont("helvetica", "bold");
    doc.text(`${totalLinks}`, margin + 65, currentY + 14);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(108, 117, 125);
    doc.text(`Timestamp execution: ${new Date().toUTCString()}`, margin + 5, currentY + 19);

    currentY += 32;

    function drawGridHeader() {
        doc.setFillColor(241, 243, 245);
        doc.rect(margin, currentY, pageWidth - (margin * 2), 8, 'F');
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(33, 37, 41);
        doc.text("Evaluated Location Target Connection", margin + 3, currentY + 5.5);
        doc.text("HTTP Code", margin + 180, currentY + 5.5);
        doc.text("Verification Signatures", margin + 215, currentY + 5.5);
        doc.setDrawColor(222, 226, 230);
        doc.setLineWidth(0.2);
        doc.line(margin, currentY + 8, pageWidth - margin, currentY + 8);
        currentY += 8;
    }

    drawGridHeader();

    tableRows.forEach((row) => {
        const cells = row.cells;
        if (cells.length < 3) return;

        const urlText = cells[0].innerText.trim();
        const codeText = cells[1].innerText.trim();
        const signatureText = cells[2].innerText.trim();

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        const wrappedUrlLines = doc.splitTextToSize(urlText, 172);
        
        const lineHeight = 5;
        const blockHeight = Math.max(wrappedUrlLines.length * lineHeight, 7);

        if (currentY + blockHeight > pageHeight - margin) {
            doc.addPage();
            currentY = 20;
            drawGridHeader();
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8.5);
        }

        doc.setTextColor(13, 110, 253);
        wrappedUrlLines.forEach((line, index) => {
            doc.text(line, margin + 3, currentY + 5 + (index * lineHeight));
        });

        if (codeText === "200") {
            doc.setTextColor(43, 138, 62);
        } else {
            doc.setTextColor(201, 42, 42);
        }
        doc.setFont("helvetica", "bold");
        doc.text(codeText, margin + 180, currentY + 5);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(33, 37, 41);
        doc.text(signatureText, margin + 215, currentY + 5);

        doc.setDrawColor(241, 243, 245);
        doc.setLineWidth(0.1);
        doc.line(margin, currentY + blockHeight, pageWidth - margin, currentY + blockHeight);

        currentY += blockHeight;
    });

    try {
        doc.save(`Sitemap-Validation-Report-${new Date().toISOString().slice(0, 10)}.pdf`);
        statusIndicator.innerText = originalStatus;
    } catch (err) {
        statusIndicator.innerText = `❌ PDF Generation Failed: ${err.message}`;
    }
}
