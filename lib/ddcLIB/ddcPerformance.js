class PerformanceRecorder {
    constructor(rate = 60, name = "Default") {
        this.rate = rate;
        this.state = {
            time: 0,
            ticks: 0,
            lastTick: 0
        };
        this.isRecording = false;
        this.name = name;
    }

    static startNewRecorder(rate, name) {
        const recorder = new PerformanceRecorder(rate, name);
        recorder.start();
        return recorder;
    }

    start() {
        if (this.isRecording){
            return false;
        }
        this.timestamp = Date.now();
        this.state.lastTick = this.timestamp;
        this.isRecording = true;
        monitor(this);
        return true;
    }

    restart() {
        let record = this.stop();
        this.start();
        return record;
    }

    stop() {
        this.isRecording = false;
        return this.generateRecord();
    }

    reset() {
        // Reset the recorder's counters
        this.timestamp = Date.now();
        this.state.time = 0;
        this.state.ticks = 0;
        this.state.lastTick = this.timestamp;
        this.isRecording = false;
    }

    generateRecord() {
        // Calculate elapsed time in seconds and create a record
        const elapsed = (Date.now() - this.timestamp) / 1000;
        return new PerformanceRecord(elapsed, this.rate, this.state.ticks);
    }
}

class PerformanceRecord {
    constructor(time, rate, actualTicks) {
        this.time = time;
        this.rate = rate;
        this.actualTicks = actualTicks;
    }

    static STATES = {
        0: "Normal",
        1: "Lagging",
        2: "High Lag",
        3: "Severe Lag",
        4: "Extreme Lag"
    };

    getState(){
        const lagPercentage = this.getLagPercentage();
        if (lagPercentage > 70) {
            return 4;
        }
        else if (lagPercentage > 50) {
            return 3;
        }
        else if (lagPercentage > 35) {
            return 2;
        }
        else if (lagPercentage > 10) {
            return 1;
        }
        else {
            return 0;
        }
    }

    getReport() {
        // Compute tps as actualTicks per second
        const tps = this.time > 0 ? this.actualTicks / this.time : 0;
        return {
            tps: tps, // calculated tps
            rate: this.rate,
            actualTicks: this.actualTicks
        };
    }

    getTPS() {
        return this.getReport().tps;
    }

    getLagPercentage() {
        const report = this.getReport();
        if (report.tps > report.rate) return 0;
        return (report.rate - report.tps) / report.rate * 100;
    }

    getTickPercentage() {
        const report = this.getReport();
        if (report.tps > report.rate) return 100;
        return report.tps / report.rate * 100;
    }

    getReportString() {
        const report = this.getReport();
        return `TPS: ${report.tps.toFixed(2)}/${report.rate}, Lag: ${this.getLagPercentage().toFixed(2)}% Status: ${PerformanceRecord.STATES[this.getState()]}`;
    }

    toString() {
        return `Time: ${this.time.toFixed(2)} sec, Ticks: ${this.actualTicks}, TPS: ${this.getReport().tps.toFixed(2)}/${this.rate}`;
    }
}

function monitor(recorder) {
    const now = Date.now();
    // Update state on every animation frame
    recorder.state.ticks++;
    recorder.state.time = (now - recorder.timestamp) / 1000;
    recorder.state.lastTick = now;
    if(recorder.isRecording) {
        requestAnimationFrame(() => monitor(recorder));
    }
}

export { PerformanceRecorder, PerformanceRecord };
export default { PerformanceRecorder, PerformanceRecord };