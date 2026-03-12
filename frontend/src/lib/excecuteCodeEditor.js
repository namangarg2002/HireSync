
const EXCECUTION_API = `${import.meta.env.VITE_API_BASE_URL}/api`;

/**
 * 
 * @param {string} language  - programming language
 * @param {string} code - source code to executed
 * @returns {Promise<{success: boolean output?: string, error?: string}>}
 */

export async function executeCode(language, code) {
    try {
        const response = await fetch(`${EXCECUTION_API}/execute`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                language,
                code
            })
        });

        const data = await response.json();
        
        return data;

    } catch (error) {
        return {
            success: false,
            error: error.message
        }
    }
}