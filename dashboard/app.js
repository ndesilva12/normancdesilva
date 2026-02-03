// Dashboard Interactivity

document.addEventListener('DOMContentLoaded', () => {
    const toolBlocks = document.querySelectorAll('.tool-block.small');
    const previewContent = document.getElementById('preview-content');
    const viewFullToolButton = document.getElementById('view-full-tool');
    let currentTool = null;

    // Preview data for each tool with widget placeholders and actual URLs
    const previewData = {
        email: {
            content: '<div class="widget-preview"><h3>Email Widget</h3><p><strong>Unread Emails:</strong> 3</p><p>Latest: "Meeting Tomorrow" from John Doe</p><p>[Placeholder for Email Widget Content]</p></div>',
            fullUrl: '/tools/email'
        },
        trending: {
            content: '<div class="widget-preview"><h3>Trending Widget</h3><p><strong>Top Topics:</strong> AI, Crypto, Tech Stocks</p><p>Click to see full trends.</p><p>[Placeholder for Trending Widget Content]</p></div>',
            fullUrl: '/tools/trending'
        },
        reader: {
            content: '<div class="widget-preview"><h3>Reader Widget</h3><p><strong>Latest Articles:</strong> "AI Breakthroughs 2026", "Market Analysis"</p><p>[Placeholder for Reader Widget Content]</p></div>',
            fullUrl: '/tools/reader'
        },
        news: {
            content: '<div class="widget-preview"><h3>News Widget</h3><p><strong>Top Stories:</strong> Global Tech Summit, New Policy Impact</p><p>[Placeholder for News Widget Content]</p></div>',
            fullUrl: '/tools/news'
        }
    };

    // Click event for small tool blocks to show preview
    toolBlocks.forEach(block => {
        block.addEventListener('click', () => {
            const toolId = block.id;
            if (previewData[toolId]) {
                // Update preview content
                previewContent.innerHTML = previewData[toolId].content;
                // Show 'View Full Tool' button and set navigation
                viewFullToolButton.style.display = 'block';
                currentTool = toolId;
                // Remove active class from all blocks
                toolBlocks.forEach(b => b.classList.remove('active'));
                // Highlight clicked block
                block.classList.add('active');
            }
        });
    });

    // Click event for 'View Full Tool' button
    viewFullToolButton.addEventListener('click', () => {
        if (currentTool && previewData[currentTool]) {
            window.location.href = previewData[currentTool].fullUrl;
        }
    });

    // CSS for active state and widget styling
    const style = document.createElement('style');
    style.textContent = `
        .tool-block.active {
            background: rgba(255, 255, 255, 0.3);
            transform: scale(1.05);
        }
        .widget-preview {
            background: rgba(255, 255, 255, 0.08);
            padding: 1rem;
            border-radius: 6px;
            border: 1px solid rgba(255, 255, 255, 0.15);
        }
        .widget-preview h3 {
            margin-top: 0;
            color: #4a90e2;
        }
    `;
    document.head.appendChild(style);
});
