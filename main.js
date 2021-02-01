import { compile } from "./compiler.js";
import { PicoBlaze } from "./picoBlaze.js";

window.addEventListener("error", (err) => alert(err.message));

const ram = document.getElementById("ram");
const registers = document.getElementById("registers");
const progmem = document.getElementById("progmem");
const code = document.getElementById("code");
const run = document.getElementById("btnRun");
const programCounter = document.getElementById("programCounter");
const stack = document.getElementById("stack");
const pointer = document.getElementById("pointer");
const stepDelay = document.getElementById("stepDelay");
const lblStepDelay = document.getElementById("lblStepDelay");
const lineNumbers = document.getElementById("lineNumbers");
let ramFields;

const pico = new PicoBlaze(() => {
    registers.innerText = [...pico._registers]
        .map(
            (v, i) =>
                `s${i.toString(16)}: 0x${v
                    .toString(16)
                    .padStart(2, "0")} = 0b${v.toString(2).padStart(8, "0")}`
        )
        .join("\n");
    if (ramFields) {
        pico._ram.forEach((v, i) => {
            ramFields[i].field.value = v.toString(16).padStart(2, "0");
            ramFields[i].label.innerText = `0x${i
                .toString(16)
                .padStart(2, "0")}: 0b${v
                .toString(2)
                .padStart(8, "0")} = ${String.fromCharCode(v)} = 0x`;
        });
    }
    stack.innerText = [...pico._stack]
        .map(
            (v, i) =>
                `0x${i.toString(16).padStart(2, "0")}: 0x${v
                    .toString(16)
                    .padStart(3, "0")} = 0b${v.toString(2).padStart(10, "0")}${
                    pico._stackPointer == i ? "<< Stack pointer" : ""
                }`
        )
        .join("\n");
    pointer.style.top = pico._programCounter * 1.5 + "em";
});
function compileAndShow() {
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
    let lineNumText = "";
    for (let i = 0; i < pico.instructionProm.length; i++) {
        lineNumText += `0x${i.toString(16).padStart(3, "0")}\n`;
    }
    lineNumbers.innerText = lineNumText;
}
code.addEventListener("input", compileAndShow);
code.addEventListener("change", compileAndShow);
stepDelay.addEventListener("input", () => {
    lblStepDelay.innerText = stepDelay.value;
});
document.getElementById("btnParse").addEventListener("click", compileAndShow);
run.addEventListener("click", () => {
    if (pico.shouldRun) {
        pico.shouldRun = false;
        run.innerText = "Run";
    } else {
        pico.shouldRun = true;
        run.innerText = "Stop";
        pico.run(parseInt(stepDelay.value))
            .then(() => {
                pico.shouldRun = false;
                run.innerText = "Run";
            })
            .catch((err) => {
                pico.shouldRun = false;
                run.innerText = "Run";
                throw err;
            });
    }
});
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

ramFields = [...pico._ram].map((v, i) => {
    const field = document.createElement("input");
    field.type = "text";
    field.id = "ramAddr" + i;
    field.pattern = "[0-9a-fA-F]{0,2}";
    const label = document.createElement("label");
    field.addEventListener("input", () => {
        if (field.validity.valid) {
            const val = parseInt(field.value, 16);
            if (isFinite(val)) {
                pico._ram[i] = val;
                label.innerText = `0x${i
                    .toString(16)
                    .padStart(2, "0")}: 0b${pico._ram[i]
                    .toString(2)
                    .padStart(8, "0")} = ${String.fromCharCode(v)} = 0x`;
            }
        }
    });
    label.setAttribute("for", field.id);
    label.innerText = `0x${i.toString(16).padStart(2, "0")}: 0b${v
        .toString(2)
        .padStart(8, "0")} = ${String.fromCharCode(v)} = 0x`;
    ram.appendChild(label);
    ram.appendChild(field);
    ram.appendChild(document.createElement("br"));
    return { field, label };
});

pico.clearRam();
pico.clearRegisters();
