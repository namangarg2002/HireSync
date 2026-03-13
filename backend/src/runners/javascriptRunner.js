import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";

export default function runJS(code) {
  return new Promise((resolve, reject) => {

    const tempDir = path.join(process.cwd(), "src", "temp");

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const filePath = path.join(tempDir, `${uuid()}.js`);


    fs.writeFileSync(filePath, code);

    const cleanup = () => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (e) {}
    };

    exec(`node "${filePath}"`,{ timeout: 5000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {

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