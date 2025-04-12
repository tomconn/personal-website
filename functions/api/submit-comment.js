// File: functions/api/submit-comment.js

// Basic HTML entity escaping function
function escapeHtml(unsafe) {
    if (!unsafe) return "";
    return unsafe
         .replace(/&/g, "&")
         .replace(/</g, "<")
         .replace(/>/g, ">")
         .replace(/'/g, "'");
}

export async function onRequestPost({ request, env }) {
    
}