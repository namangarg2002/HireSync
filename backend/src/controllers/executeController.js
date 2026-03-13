import runCpp from "../runners/cppRunner.js";
import runPython from "../runners/pythonRunner.js";
import runJS from "../runners/javascriptRunner.js";
import runJava from "../runners/javaRunner.js";

async function codeEditorExecution(req, res) {
    console.log("Incoming request:", req.body);
    const { language, code } = req.body;

    try {
        let output;

        switch (language) {
        case "javascript":
            output = await runJS(code);
            break;

        case "python":
            output = await runPython(code);
            break;

        case "cpp":
            output = await runCpp(code);
            break;

        case "java":
            output = await runJava(code);
            break;

        default:
            return res.status(400).json({
                success: false,
                error: "Unsupported language" 
            });
        }

        return res.json({
            success: true,
            output
        });

    } catch (error) {
        return res.json({
            success:false,
            error:error.toString()
        });
    }
}

export { codeEditorExecution }