const AND = 0x02;
const OR = 0x03;
const XOR = 0x04;
const ADD = 0x05;
const ADDCY = 0x06;
const SUB = 0x07;
const SUBCY = 0x08;
const RL = 0x09;
const RR = 0x0a;
const SL0 = 0x0b;
const SL1 = 0x0c;
const SLA = 0x0d;
const SLX = 0x0e;
const SR0 = 0x0b;
const SR1 = 0x0c;
const SRA = 0x0d;
const SRX = 0x0e;

export class PicoBlaze {
    _ram = new Uint8Array(64);
    _registers = new Uint8Array(16);
    _stack = new Uint16Array(31); //10 lower bits used
    _zeroFlag = false; //boolean
    _carryFlag = false; //boolean
    _programCounter = 0; //10 bit num
    _stackPointer = 30; //5 bit num
    _changedCallback = () => {};

    instructionProm = new Uint32Array(1024); //18 bits used

    constructor(changedCallback) {
        if (typeof changedCallback === "function") {
            this._changedCallback = changedCallback;
        }
    }

    step() {
        const instr = this.instructionProm[this._programCounter];
        const opCode = (instr & 0xff000) >> 12;
        const opReg1 = (instr & 0xf00) >> 8;
        const opReg2 = (instr & 0xf0) >> 4;
        const immediate = instr & 0xff;
        let aluOpCode = 0;
        let useImmediate = false;
        let storeResult = true;
        let doClockCycle = true;
        switch (opCode) {
            case 0x0a: //AND immediate
                useImmediate = true;
            case 0x0b: //AND
                aluOpCode = AND;
                break;
            case 0x0c: //OR immediate
                useImmediate = true;
            case 0x0d: //OR
                aluOpCode = OR;
                break;
            case 0x0e: //XOR immediate
                useImmediate = true;
            case 0x0f: //XOR
                aluOpCode = XOR;
                break;
            case 0x18: //ADD immediate
                useImmediate = true;
            case 0x19: //ADD
                aluOpCode = ADD;
                break;
            case 0x1a: //ADDCY immediate
                useImmediate = true;
            case 0x1b: //ADDCY
                aluOpCode = ADDCY;
                break;
            case 0x1c: //SUB immediate
                useImmediate = true;
            case 0x1d: //SUB
                aluOpCode = SUB;
                break;
            case 0x1e: //SUBCY immediate
                useImmediate = true;
            case 0x1f: //SUBCY
                aluOpCode = SUBCY;
                break;
            case 0x14: //COMPARE immediate
                useImmediate = true;
            case 0x15: //COMPARE
                aluOpCode = SUB;
                storeResult = false;
                break;
            case 0x12: //TEST immediate
                useImmediate = true;
            case 0x13: //TEST
                aluOpCode = AND;
                storeResult = false;
                break;
            case 0x20: //shift
                switch (immediate) {
                    case 0x02: //RL
                        aluOpCode = RL;
                        break;
                    case 0x0c: //RR
                        aluOpCode = RR;
                        break;
                    case 0x06: //SL0
                        aluOpCode = SL0;
                        break;
                    case 0x07: //SL1
                        aluOpCode = SL1;
                        break;
                    case 0x00: //SLA
                        aluOpCode = SLA;
                        break;
                    case 0x04: //SLX
                        aluOpCode = SLX;
                        break;
                    case 0x0e: //SR0
                        aluOpCode = SR0;
                        break;
                    case 0x0f: //SR1
                        aluOpCode = SR1;
                        break;
                    case 0x08: //SRA
                        aluOpCode = SRA;
                        break;
                    case 0x0a: //SRX
                        aluOpCode = SRX;
                        break;
                    default:
                        alert("Unknown instruction at " + this._programCounter);
                        throw new Error("Unknown instruction");
                }
                break;
            case 0x30: //call
                doClockCycle = false;
                this.call(immediate);
                break;
            case 0x31: //conditional call
                doClockCycle = false;
                switch (op2) {
                    case 0x0: //call if zero
                        if (this._zeroFlag) {
                            this.call(immediate);
                        }
                        break;
                    case 0x4: //call not zero
                        if (!this._zeroFlag) {
                            this.call(immediate);
                        }
                        break;
                    case 0x8: //call if carry
                        if (this._carryFlag) {
                            this.call(immediate);
                        }
                        break;
                    case 0xc: //call not carry
                        if (!this._carryFlag) {
                            this.call(immediate);
                        }
                        break;
                }
                break;
            case 0x34: //jump
                doClockCycle = false;
                this.jump(immediate);
                break;
            case 0x35: //conditional jump
                doClockCycle = false;
                switch (op2) {
                    case 0x0: //jump if zero
                        if (this._zeroFlag) {
                            this.jump(immediate);
                        }
                        break;
                    case 0x4: //jump not zero
                        if (!this._zeroFlag) {
                            this.jump(immediate);
                        }
                        break;
                    case 0x8: //jump if carry
                        if (this._carryFlag) {
                            this.jump(immediate);
                        }
                        break;
                    case 0xc: //jump not carry
                        if (!this._carryFlag) {
                            this.jump(immediate);
                        }
                        break;
                }
                break;
            case 0x2a: //return
                doClockCycle = false;
                this.return();
                break;
            case 0x35: //conditional return
                doClockCycle = false;
                switch (op2) {
                    case 0x0: //return if zero
                        if (this._zeroFlag) {
                            this.return();
                        }
                        break;
                    case 0x4: //return not zero
                        if (!this._zeroFlag) {
                            this.return();
                        }
                        break;
                    case 0x8: //return if carry
                        if (this._carryFlag) {
                            this.return();
                        }
                        break;
                    case 0xc: //return not carry
                        if (!this._carryFlag) {
                            this.return();
                        }
                        break;
                }
                break;
            default:
                alert("Unknown instruction at " + this._programCounter);
                throw new Error("Unknown instruction");
        }
        this.clockCycle(
            opReg1,
            opReg2,
            immediate,
            useImmediate,
            storeResult ? opReg1 : -1,
            0,
            false,
            aluOpCode
        );
        this._programCounter = (this._programCounter + 1) % 1024;
    }

    clearRegisters() {
        this._registers.fill(0, 0);
        this._changedCallback();
    }

    clearRam() {
        this._ram.fill(0, 0);
        this._changedCallback();
    }

    reset() {
        this._programCounter = 0;
        this._zeroFlag = false;
        this._carryFlag = false;
        this._stack.fill(0, 0);
    }

    clockCycle(
        operandRegister1,
        operandRegister2,
        immediateVal,
        useImmediateOp2,
        resultRegister,
        inPort,
        useInPort,
        aluOpCode
    ) {
        const op1 = this._registers[operandRegister1];
        const op2 = useImmediateOp2
            ? immediateVal
            : this._registers[operandRegister2];
        let res = this.alu(aluOpCode, op1, op2);
        if (
            aluOpCode == RR ||
            aluOpCode == SR0 ||
            aluOpCode == SR1 ||
            aluOpCode == SRA ||
            aluOpCode == SRX
        ) {
            this._carryFlag = (op1 && 0x01) == 0x01;
        } else {
            this._carryFlag = (res >> 8 && 0x01) == 0x01;
        }
        res = 0xff & res;
        this._zeroFlag = res == 0;
        if (resultRegister >= 0) {
            this._registers[resultRegister] = useInPort
                ? inPort[useImmediateOp2 ? immediateVal : op2]
                : res;
        }
        this._changedCallback();
    }

    alu(opCode, op1, op2) {
        switch (opCode) {
            case AND:
                return op1 & op2;
            case OR:
                return op1 | op2;
            case XOR:
                return op1 ^ op2;
            case ADD:
                return op1 + op2;
            case ADDCY:
                return op1 + op2 + (this._carryFlag ? 1 : 0);
            case SUB:
                return op1 - op2;
            case SUBCY:
                return op1 - op2 - (this._carryFlag ? 1 : 0);
            case RL:
                return ((op1 << 1) & 0x1fe) | ((op1 >> 7) & 0x01);
            case RR:
                return ((op1 >> 1) & 0x7f) | ((op1 << 7) & 0x80);
            case SL0:
                return (op1 << 1) & 0x1fe;
            case SL1:
                return (op1 << 1) | 0x01;
            case SLA:
                return ((op1 << 1) & 0x1fe) | (this._carryFlag ? 1 : 0);
            case SLX:
                return ((op1 << 1) & 0x1fe) | (op1 & 0x01);
            case SR0:
                return (op1 >> 1) & 0x7f;
            case SR1:
                return (op1 >> 1) | 0x80;
            case SRA:
                return ((op1 >> 1) & 0x7f) | (this._carryFlag ? 0x80 : 0);
            case SRX:
                return ((op1 >> 1) & 0x7f) | (op1 & 0x80);
            default:
                alert("Unknown instruction at " + this._programCounter);
                throw new Error("Unknown instruction");
        }
    }

    storeRam(register, ramAddress) {
        this._ram[ramAddress] = this._registers[register];
        this._changedCallback();
    }

    loadRam(register, ramAddress) {
        this._registers[register] = this._ram[ramAddress];
        this._changedCallback();
    }

    jump(address) {
        this._programCounter = address;
        this._changedCallback();
    }

    call(address) {
        this._stackPointer = (this._stackPointer + 1) % 31;
        this._stack[this._stackPointer] = this._programCounter;
        this._programCounter = address;
        this._changedCallback();
    }

    return() {
        this._programCounter = this._stack[this._stackPointer];
        this._stackPointer = (this._stackPointer + 30) % 31;
        this._changedCallback();
    }
}
