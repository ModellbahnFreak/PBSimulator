import { compile, loader } from "./compiler.js";
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
            ramFields[i].label1.innerText = `0x${i
                .toString(16)
                .padStart(2, "0")}: 0b${v.toString(2).padStart(8, "0")} = 0x`;
            ramFields[i].label2.innerText = ` = ${String.fromCharCode(v)}`;
        });
    }
    programCounter.innerText = `0x${pico._programCounter
        .toString(16)
        .padStart(3, "0")} has instruction 0x${pico.instructionProm[
        pico._programCounter
    ]
        .toString(16)
        .padStart(5, "0")} (${pico.getInstuctionStr(
        pico.instructionProm[pico._programCounter]
    )})`;
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
    pico.instructionProm = loader(code.innerText);
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
    pico._changedCallback();
}
code.addEventListener("input", compileAndShow);
code.addEventListener("change", compileAndShow);
stepDelay.addEventListener("input", () => {
    lblStepDelay.innerText = stepDelay.value;
});
document.getElementById("btnParse").addEventListener("click", () => {
    compileAndShow();
    code.innerText = [...pico.instructionProm]
        .map((v, i) => v.toString(16).padStart(5, "0"))
        .join("\n");
});
run.addEventListener("click", () => {
    if (pico.shouldRun) {
        pico.shouldRun = false;
        run.innerText = "Run";
    } else {
        pico.shouldRun = true;
        run.innerText = "Stop";
        pico.run(parseInt(stepDelay.value));
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
    field.style.width = "2em";
    const label1 = document.createElement("label");
    const label2 = document.createElement("label");
    field.addEventListener("input", () => {
        if (field.validity.valid) {
            const val = parseInt(field.value, 16);
            if (isFinite(val)) {
                pico._ram[i] = val;
                label1.innerText = `0x${i
                    .toString(16)
                    .padStart(2, "0")}: 0b${pico._ram[i]
                    .toString(2)
                    .padStart(8, "0")} = 0x`;
                label2.innerText = ` = ${String.fromCharCode(v)}`;
            }
        }
    });
    label1.setAttribute("for", field.id);
    label1.innerText = `0x${i.toString(16).padStart(2, "0")}: 0b${v
        .toString(2)
        .padStart(8, "0")} = 0x`;
    label2.setAttribute("for", field.id);
    label2.innerText = ` = ${String.fromCharCode(v)}`;
    ram.appendChild(label1);
    ram.appendChild(field);
    ram.appendChild(label2);
    ram.appendChild(document.createElement("br"));
    return { field, label1, label2 };
});

pico.clearRam();
pico.clearRegisters();
