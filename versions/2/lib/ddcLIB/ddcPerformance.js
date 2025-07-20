class PerformanceRecorder {
  constructor(rate = 60, name = "Default") {
    this.rate = rate;
    this.state = {
      time: 0,
      ticks: 0,
      lastTick: 0,
    };
    this.isRecording = false;
    this.name = name;
    // New: store RAF id for cancellation
    this.rafId = null;
  }

  static startNewRecorder(rate, name) {
    const recorder = new PerformanceRecorder(rate, name);
    recorder.start();
    return recorder;
  }

  start() {
    if (this.isRecording) {
      return false;
    }
    this.timestamp = Date.now();
    this.state.lastTick = this.timestamp;
    // Reset ticks when starting
    this.state.ticks = 0;
    this.isRecording = true;
    // Store RAF id for later cancellation
    this.rafId = requestAnimationFrame(() => monitor(this));
    return true;
  }

  restart() {
    let record = this.stop();
    this.reset();
    this.start();
    return record;
  }

  stop() {
    this.isRecording = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    return this.generateRecord();
  }

  reset() {
    // Cancel any pending RAF callbacks
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
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
    4: "Extreme Lag",
  };

  getState() {
    const lagPercentage = this.getLagPercentage();
    if (lagPercentage > 70) {
      return 4;
    } else if (lagPercentage > 50) {
      return 3;
    } else if (lagPercentage > 35) {
      return 2;
    } else if (lagPercentage > 10) {
      return 1;
    } else {
      return 0;
    }
  }

  getReport() {
    // Compute tps as actualTicks per second
    const tps = this.time > 0 ? this.actualTicks / this.time : 0;
    return {
      tps: tps, // calculated tps
      rate: this.rate,
      actualTicks: this.actualTicks,
    };
  }

  getTPS() {
    return this.getReport().tps;
  }

  getLagPercentage() {
    const report = this.getReport();
    if (report.tps > report.rate) return 0;
    return ((report.rate - report.tps) / report.rate) * 100;
  }

  getTickPercentage() {
    const report = this.getReport();
    if (report.tps > report.rate) return 100;
    return (report.tps / report.rate) * 100;
  }

  getReportString() {
    const report = this.getReport();
    return `TPS: ${report.tps.toFixed(2)}/${
      report.rate
    }, Lag: ${this.getLagPercentage().toFixed(2)}% Status: ${
      PerformanceRecord.STATES[this.getState()]
    }`;
  }

  toString() {
    return `Time: ${this.time.toFixed(2)} sec, Ticks: ${
      this.actualTicks
    }, TPS: ${this.getReport().tps.toFixed(2)}/${this.rate}`;
  }
}

// update monitor to store new RAF id each frame
function monitor(recorder) {
  const now = Date.now();
  recorder.state.ticks++;
  recorder.state.time = (now - recorder.timestamp) / 1000;
  recorder.state.lastTick = now;
  if (recorder.isRecording) {
    recorder.rafId = requestAnimationFrame(() => monitor(recorder));
  }
}

class Stopwatch {
  constructor(func) {
    this.func = func;
    this.timer = new Timer();
    this.isRunning = false;
  }

  static fromFunc(func) {
    return new Stopwatch(func);
  }

  static async startNew(func) {
    const stopwatch = new Stopwatch(func);
    await stopwatch.run();
    return stopwatch;
  }

  static async startNewXT(func, times) {
    const stopwatch = new Stopwatch(func);
    await stopwatch.runXT(times);
    return stopwatch;
  }

  static async measure(func) {
    const stopwatch = new Stopwatch(func);
    return await stopwatch.run();
  }

  static async measureXT(func, times) {
    const stopwatch = new Stopwatch(func);
    return await stopwatch.runXT(times);
  }

  async run() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.timer.start();
    await this.func();
    this.isRunning = false;
    return this.timer.stop();
  }

  async runXT(times) {
    if (this.isRunning) return;
    this.isRunning = true;
    this.timer.startNew();
    for (let i = 0; i < times; i++) await this.func();
    this.isRunning = false;
    return this.timer.stop();
  }

  async runAndFormat() {
    return `Elapsed: ${((await this.run()) / 1000).toFixed(2)}sec(s)`;
  }
}

class Ticker {
  constructor(func, interval) {
    this.stopwatch = Stopwatch.fromFunc(func);
    this.interval = interval;
    this.report = {
      time: 0,
      expected: 0,
      avgDelta: 0,
      times: 0,
    };
    this.isRunning = false;
  }

  static fromFunc(func, interval) {
    return new Ticker(func, interval);
  }

  getDetailedReport() {
    return {
      time: this.report.time,
      expected: this.report.expected,
      avgDelta: this.report.avgDelta,
      avgLag: Math.max(0, this.report.avgDelta - this.interval),
      lagPercentage:
        Math.max(0, (this.report.avgDelta - this.interval) / this.interval) *
        100,
      runs: this.report.times,
      rps: (this.report.times * 1000) / Math.max(1, this.report.time),
    };
  }

  getReportString() {
    const report = this.getDetailedReport();
    return `RPS: ${report.rps.toFixed(2)}, Lag: ${report.avgLag.toFixed(
      2
    )}ms, Lag Percentage: ${report.lagPercentage.toFixed(2)}%`;
  }

  async runXT(times) {
    if (this.isRunning) return;
    this.isRunning = true;
    this.reset();
    this.report.times = times;
    let lag = 0;
    for (let i = 0; i < times; i++) {
      if (this.isRunning) {
        lag = await this.stopwatch.run();
        this.report.time += lag;
        await sleep(Math.max(0, this.interval - lag));
      }
    }
    this.report.expected = times * this.interval;
    this.report.avgDelta = this.report.time / times;
    this.isRunning = false;
    return this.report;
  }

  async runContinuously() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.reset();
    let lag = 0;
    while (this.isRunning) {
      lag = await this.stopwatch.run();
      this.report.time += lag;
      this.report.expected += this.interval;
      this.report.avgDelta = this.report.time / this.report.times;
      this.report.times++;
      await sleep(Math.max(0, this.interval - lag));
    }
    this.isRunning = false;
    return this.report;
  }

  stop() {
    this.isRunning = false;
  }

  reset() {
    this.report.time = 0;
    this.report.expected = 0;
    this.report.actual = 0;
    this.report.delta = 0;
    this.report.times = 0;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class Timer {
  constructor() {
    this.isRunning = false;
  }

  static startNew() {
    const timer = new Timer();
    timer.start();
    return timer;
  }

  start() {
    if (this.isRunning) return;
    this.startTime = Date.now();
    this.isRunning = true;
  }

  stop() {
    if (!this.isRunning) return;
    this.endTime = Date.now();
    this.isRunning = false;
    return this.endTime - this.startTime;
  }
}

export { PerformanceRecorder, PerformanceRecord, Stopwatch, Ticker, Timer, sleep };
export default { PerformanceRecorder, Timer, sleep };
