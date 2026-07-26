const fs = require('fs');
const path = require('path');

const publicDir = 'c:\\Users\\ammu\\Desktop\\final gym\\site\\public';

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace text
    content = content.replace(/IRON PULSE/g, 'FREEDOM FITNESS');
    content = content.replace(/IRON<span([^>]*)>PULSE<\/span>/g, 'FREEDOM<span$1>FITNESS</span>');
    content = content.replace(/IRON\s*<span([^>]*)>PULSE<\/span>/g, 'FREEDOM <span$1>FITNESS</span>');
    content = content.replace(/Iron Pulse/gi, 'Freedom Fitness');
    
    // Replace logo image paths
    content = content.replace(/\/icons\/WhatsApp Image 2026-03-08 at 5\.39\.03 PM\.jpeg/g, '/icons/logo.png');
    
    fs.writeFileSync(filePath, content, 'utf8');
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.html') || fullPath.endsWith('.js') || fullPath.endsWith('.json') || fullPath.endsWith('.webmanifest')) {
            replaceInFile(fullPath);
        }
    }
}

processDirectory(publicDir);
console.log('App name and logo path updated successfully.');
