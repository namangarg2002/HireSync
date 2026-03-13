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

    exec(`g++ "${cppFile}" -o "${exeFile}" && "${exeFile}"`, { timeout: 5000 }, (error, stdout, stderr) => {

      if (fs.existsSync(cppFile)) fs.unlinkSync(cppFile);
      if (fs.existsSync(exeFile)) fs.unlinkSync(exeFile);

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