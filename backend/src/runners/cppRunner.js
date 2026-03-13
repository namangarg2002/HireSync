import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";

export default function runCpp(code) {
  return new Promise((resolve, reject) => {

    const id = uuid();
    const tempDir = path.join(process.cwd(), "src", "temp");

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const cppFile = path.join(tempDir, `${id}.cpp`);
    const exeFile = path.join(tempDir, `${id}.exe`);

    fs.writeFileSync(cppFile, code);

    const cleanup = () => {
      try {
        if (fs.existsSync(cppFile)) fs.unlinkSync(cppFile);
        if (fs.existsSync(exeFile)) fs.unlinkSync(exeFile);
      } catch (e) {}
    };

    exec(`g++ "${cppFile}" -o "${exeFile}" && "${exeFile}"`, { timeout: 5000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {

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
    });
  });
}