import { compile } from "./compiler.js";
import { PicoBlaze } from "./picoBlaze.js";

const ram = document.getElementById("ram");
const registers = document.getElementById("registers");
const progmem = document.getElementById("progmem");
const code = document.getElementById("code");

document.getElementById("lineNumbers").innerText =
    "1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n12\n13\n14\n15";

const pico = new PicoBlaze(() => {
    registers.innerText = [...pico._registers]
        .map(
            (v, i) =>
                `s${i.toString(16)}: 0x${v
                    .toString(16)
                    .padStart(2, "0")} = 0b${v.toString(2).padStart(8, "0")}`
        )
        .join("\n");
    ram.innerText = [...pico._ram]
        .map(
            (v, i) =>
                `0x${i.toString(16).padStart(2, "0")}: 0x${v
                    .toString(16)
                    .padStart(2, "0")} = 0b${v
                    .toString(2)
                    .padStart(8, "0")} = ${String.fromCharCode(v)}`
        )
        .join("\n");
});
pico.clearRam();
pico.clearRegisters();
document.getElementById("btnParse").addEventListener("click", () => {
    pico.instructionProm = new Uint32Array(
        code.innerText
            .split("\n")
            .filter((l) => l.length > 0)
            .map((v) => parseInt(v, 16))
    );
    progmem.innerText = [...pico.instructionProm]
        .map(
            (v, i) =>
                `0x${i.toString(16).padStart(3, "0")}: 0x${v
                    .toString(16)
                    .padStart(5, "0")}`
        )
        .join("\n");
});
document.getElementById("btnRun").addEventListener("click", () => {});
document.getElementById("btnStep").addEventListener("click", () => {
    pico.step();
});
document.getElementById("btnReset").addEventListener("click", () => {
    pico.reset();
});
document.getElementById("btnClear").addEventListener("click", () => {
    pico.clearRam();
    pico.clearRegisters();
});
