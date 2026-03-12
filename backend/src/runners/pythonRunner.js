import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";

export default function runPython(code) {
  return new Promise((resolve, reject) => {

    const tempDir = path.join(process.cwd(), "src", "temp");

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const filePath = path.join(tempDir, `${uuid()}.py`);

    fs.writeFileSync(filePath, code);

    exec(`python "${filePath}"`, { timeout: 5000 }, (error, stdout, stderr) => {

      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

      if (error) {
        return reject(stderr || error.message);
      }

      if (stderr) {
        return reject(stderr);
      }
      resolve(stdout);
    });
  });
}