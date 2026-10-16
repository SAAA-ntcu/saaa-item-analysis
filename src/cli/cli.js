/**
 * SAAA 試題分析與成績計算 CLI 主入口 (Node.js)
 * 支援模式分離：
 *   - 執行成績計算: node cli.js --mode=scoring  (或 node cli_scoring.js)
 *   - 執行試題分析: node cli.js --mode=ctt      (或 node cli_ctt.js)
 *   - 全科批次整合: node cli.js --mode=all      (預設)
 */

const { spawn } = require("child_process");
const path = require("path");

const args = process.argv.slice(2);
const modeArg = args.find(a => a.startsWith("--mode="))?.split("=")[1]?.toLowerCase() || "all";

const passthroughArgs = args.filter(a => !a.startsWith("--mode="));

function runChild(scriptName) {
  return new Promise((resolve, reject) => {
    const p = spawn("node", [path.join(__dirname, scriptName), ...passthroughArgs], { stdio: "inherit" });
    p.on("close", code => {
      if (code === 0) resolve();
      else reject(new Error(`${scriptName} exited with code ${code}`));
    });
  });
}

async function main() {
  if (modeArg === "scoring") {
    console.log("▶️ 正在以【成績計算模式】獨立執行...");
    await runChild("cli_scoring.js");
  } else if (modeArg === "ctt") {
    console.log("▶️ 正在以【試題分析模式】獨立執行...");
    await runChild("cli_ctt.js");
  } else {
    console.log("▶️ 正在執行【成績計算】與【試題分析】完整全科管線...");
    await runChild("cli_ctt.js");
    await runChild("cli_scoring.js");
    console.log("🎉 全部試題分析與成績計算已成功分開執行並完成！");
  }
}

main().catch(err => {
  console.error("執行失敗:", err);
  process.exit(1);
});
