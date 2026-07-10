// --- Environment Detection & Proxy Configuration ---
const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Vercel project deployment URL
const MY_PROXY_URL = 'https://sitemap-link-validator.vercel.app/api/proxy?url=';

// --- Helper to fetch through proxy ---
async function proxyFetch(url) {
    try {
        const response = await fetch(MY_PROXY_URL + encodeURIComponent(url), {
            method: 'GET',
            headers: {
                'Accept': 'application/xml, text/xml, */*'
            }
        });
        
        if (!response.ok) {
            const error = new Error(`HTTP Error: ${response.status}`);
            error.status = response.status;
            throw error;
        }
        return response;
    } catch (err) {
        throw err;
    }
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
    const scanSummary = document.getElementById('scanSummary');

    if (!sitemapUrl) {
        alert('Please assign a targeted sitemap link.');
        return;
    }

    resultsBody.innerHTML = '';
    scanSummary.style.display = 'none';
    scanBtn.disabled = true;
    if (pdfBtn) pdfBtn.disabled = true;

    statusIndicator.innerHTML = `<span class="spinner"></span> <span>📡 Analyzing Sitemap Data...</span>`;

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
            
            statusIndicator.innerHTML = `<span class="spinner"></span> <span>⏳ Parsing (${i + 1}/${urls.length}): ${url}</span>`;
            
            let statusCode = 'N/A';
            let statusText = 'Unknown';
            let rowClass = 'status-error';

            try {
                const res = await proxyFetch(url);
                statusCode = res.status;
                statusText = res.redirected ? 'OK (Redirected)' : 'OK';
                rowClass = 'status-200';
            } catch (err) { 
                statusCode = err.status || 'ERR';
                if (statusCode === 404) {
                    statusText = 'Not Found';
                } else if (statusCode >= 500) {
                    statusText = 'Server Error';
                } else {
                    statusText = 'Network Unreachable';
                }
                rowClass = 'status-error';
            }

            const row = `<tr>
                <td><a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #0d6efd; text-decoration: underline;">${url}</a></td>
                <td class="${rowClass}">${statusCode}</td>
                <td>${statusText}</td>
            </tr>`;
            resultsBody.insertAdjacentHTML('beforeend', row);
        }

        // --- Calculate Summary Stats ---
        const tableRows = Array.from(document.querySelectorAll('#resultsBody tr:not(.table-empty-row)'));
        const stats = tableRows.reduce((acc, row) => {
            const code = parseInt(row.cells[1].innerText);
            const statusText = row.cells[2].innerText;
            
            if (code >= 200 && code < 300) {
                acc.ok++;
                if (statusText.includes('Redirected')) acc.redirects++;
            } else if (code >= 300 && code < 400) {
                acc.redirects++;
            } else {
                acc.errors++;
            }
            return acc;
        }, { ok: 0, redirects: 0, errors: 0 });

        // Update UI Summary
        document.getElementById('sumOk').innerText = `${stats.ok} OK`;
        document.getElementById('sumRedir').innerText = `${stats.redirects} Redirected`;
        document.getElementById('sumErr').innerText = `${stats.errors} Errors`;
        scanSummary.style.display = 'block';

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
    const scanSummary = document.getElementById('scanSummary');

    document.getElementById('sitemapUrl').value = '';
    scanSummary.style.display = 'none';
    
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
    const tableRows = Array.from(document.querySelectorAll('#resultsBody tr:not(.table-empty-row)'));
    const totalLinks = tableRows.length;
    
    if (totalLinks === 0) {
        alert('No metrics data available to export. Run a successful scan first.');
        return;
    }

    const stats = tableRows.reduce((acc, row) => {
        const code = parseInt(row.cells[1].innerText);
        const statusText = row.cells[2].innerText; 
        
        if (code >= 200 && code < 300) {
            acc.ok++;
            if (statusText.includes('Redirected')) acc.redirects++;
        } else if (code >= 300 && code < 400) {
            acc.redirects++;
        } else {
            acc.errors++;
        }
        return acc;
    }, { ok: 0, redirects: 0, errors: 0 });

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
    doc.rect(margin, currentY, pageWidth - (margin * 2), 30, 'F');
    doc.setDrawColor(16, 124, 65);
    doc.setLineWidth(1);
    doc.line(margin, currentY, margin, currentY + 30);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(73, 80, 87);
    doc.text("SITEMAP AUTOMATION WORKSPACE REPORT METRICS SUMMARY", margin + 5, currentY + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Total: ${totalLinks} | Success: ${stats.ok} | Redirects: ${stats.redirects} | Errors: ${stats.errors}`, margin + 5, currentY + 14);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(108, 117, 125);
    doc.text(`Timestamp execution: ${new Date().toUTCString()}`, margin + 5, currentY + 24);

    currentY += 40;

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

        if (codeText === "200") doc.setTextColor(43, 138, 62);
        else doc.setTextColor(201, 42, 42);

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
