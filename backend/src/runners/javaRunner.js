import { exec } from "child_process";
import fs from "fs";
import path from "path";

export default function runJava(code) {
  return new Promise((resolve, reject) => {

    const tempDir = path.join(process.cwd(), "src", "temp");

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const javaFile = path.join(tempDir, "Solution.java");
    const classFile = path.join(tempDir, "Solution.class");

    fs.writeFileSync(javaFile, code);

    const cleanup = () => {
      try {
        if (fs.existsSync(javaFile)) fs.unlinkSync(javaFile);
        if (fs.existsSync(classFile)) fs.unlinkSync(classFile);
      } catch (e) {}
    };

    exec(
      `javac "${javaFile}" && java -cp "${tempDir}" Solution`,
      { timeout: 5000, maxBuffer: 1024 * 1024 },
      (error, stdout, stderr) => {

        cleanup();

        if (error) {
          if (error.killed) {
            return reject("Execution Timeout: Infinite loop detected (5s limit)");
          }

          if (error.signal === "SIGTERM") {
            return reject("Execution terminated due to timeout");
          }

          return reject(stderr || error.message);
        }

        if (stderr && stderr.trim().length > 0) {
          return reject(stderr);
        }
        resolve(stdout);
      }
    );
  });
}