/**
 * @typedef {Object} PerformanceState
 * @property {number} time - Total time elapsed in seconds
 * @property {number} ticks - Total number of ticks recorded
 * @property {number} lastTick - Timestamp of the last tick
 */

/**
 * @typedef {Object} PerformanceReport
 * @property {number} tps - Ticks per second
 * @property {number} rate - Target rate (ticks per second)
 * @property {number} actualTicks - Actual number of ticks recorded
 */

/**
 * Performance recorder class for measuring and tracking performance metrics
 */
class PerformanceRecorder {
  /**
   * @param {number} [rate=60] - Target ticks per second
   * @param {string} [name="Default"] - Name for this recorder instance
   */
  constructor(rate = 60, name = "Default") {
    /** @type {number} */
    this.rate = rate;
    
    /** @type {PerformanceState} */
    this.state = {
      time: 0,
      ticks: 0,
      lastTick: 0,
    };
    
    /** @type {boolean} */
    this.isRecording = false;
    
    /** @type {string} */
    this.name = name;
    
    /** @type {number|null} */
    this.rafId = null;
    
    /** @type {number} */
    this.timestamp = 0;
  }

  /**
   * Creates and starts a new PerformanceRecorder instance
   * @param {number} rate - Target ticks per second
   * @param {string} [name] - Optional name for the recorder
   * @returns {PerformanceRecorder} The started recorder instance
   */
  static startNewRecorder(rate, name) {
    const recorder = new PerformanceRecorder(rate, name);
    recorder.start();
    return recorder;
  }

  /**
   * Starts the performance recording
   * @returns {boolean} True if recording started, false if already running
   */
  start() {
    if (this.isRecording) {
      return false;
    }
    this.timestamp = performance.now();
    this.state.lastTick = this.timestamp;
    this.state.ticks = 0;
    this.isRecording = true;
    this.rafId = requestAnimationFrame(() => monitor(this));
    return true;
  }

  /**
   * Restarts the performance recording
   * @returns {PerformanceRecord} The record from before restart
   */
  restart() {
    const record = this.stop();
    this.reset();
    this.start();
    return record;
  }

  /**
   * Stops the performance recording
   * @returns {PerformanceRecord} The final performance record
   */
  stop() {
    this.isRecording = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    return this.generateRecord();
  }

  /**
   * Resets the performance recorder to initial state
   */
  reset() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.timestamp = performance.now();
    this.state.time = 0;
    this.state.ticks = 0;
    this.state.lastTick = this.timestamp;
    this.isRecording = false;
  }

  /**
   * Generates a performance record from current state
   * @private
   * @returns {PerformanceRecord} The generated performance record
   */
  generateRecord() {
    const elapsed = (performance.now() - this.timestamp) / 1000;
    return new PerformanceRecord(elapsed, this.rate, this.state.ticks);
  }
}

/**
 * Represents a performance record with analysis capabilities
 */
class PerformanceRecord {
  /**
   * @param {number} time - Total time elapsed in seconds
   * @param {number} rate - Target ticks per second
   * @param {number} actualTicks - Actual number of ticks recorded
   */
  constructor(time, rate, actualTicks) {
    /** @type {number} */
    this.time = time;
    
    /** @type {number} */
    this.rate = rate;
    
    /** @type {number} */
    this.actualTicks = actualTicks;
  }

  /** @type {Object<number, string>} */
  static STATES = {
    0: "Normal",
    1: "Lagging",
    2: "High Lag",
    3: "Severe Lag",
    4: "Extreme Lag",
  };

  /**
   * Gets the performance state based on lag percentage
   * @returns {number} State code (0-4)
   */
  getState() {
    const lagPercentage = this.getLagPercentage();
    if (lagPercentage > 70) return 4;
    if (lagPercentage > 50) return 3;
    if (lagPercentage > 35) return 2;
    if (lagPercentage > 10) return 1;
    return 0;
  }

  /**
   * Gets a performance report object
   * @returns {PerformanceReport} The performance report
   */
  getReport() {
    const tps = this.time > 0 ? this.actualTicks / this.time : 0;
    return {
      tps,
      rate: this.rate,
      actualTicks: this.actualTicks,
    };
  }

  /**
   * Gets the current ticks per second
   * @returns {number} Ticks per second
   */
  getTPS() {
    return this.getReport().tps;
  }

  /**
   * Calculates the lag percentage
   * @returns {number} Lag percentage (0-100)
   */
  getLagPercentage() {
    const report = this.getReport();
    return report.tps >= report.rate ? 0 : ((report.rate - report.tps) / report.rate) * 100;
  }

  /**
   * Calculates the tick percentage
   * @returns {number} Tick percentage (0-100)
   */
  getTickPercentage() {
    const report = this.getReport();
    return report.tps > report.rate ? 100 : (report.tps / report.rate) * 100;
  }

  /**
   * Gets a formatted report string
   * @returns {string} Formatted performance report
   */
  getReportString() {
    const report = this.getReport();
    return `TPS: ${report.tps.toFixed(2)}/${report.rate}, ` +
           `Lag: ${this.getLagPercentage().toFixed(2)}% ` +
           `Status: ${PerformanceRecord.STATES[this.getState()]}`;
  }

  /**
   * Returns a string representation of the performance record
   * @returns {string} String representation
   */
  toString() {
    return `Time: ${this.time.toFixed(2)} sec, ` +
           `Ticks: ${this.actualTicks}, ` +
           `TPS: ${this.getReport().tps.toFixed(2)}/${this.rate}`;
  }
}

/**
 * Monitors the performance by updating the recorder state
 * @private
 * @param {PerformanceRecorder} recorder - The performance recorder instance
 */
function monitor(recorder) {
  const now = performance.now();
  recorder.state.ticks++;
  recorder.state.time = (now - recorder.timestamp) / 1000;
  recorder.state.lastTick = now;
  if (recorder.isRecording) {
    recorder.rafId = requestAnimationFrame(() => monitor(recorder));
  }
}

/**
 * A simple stopwatch for measuring function execution time
 */
class Stopwatch {
  /**
   * @param {Function} func - The function to measure
   */
  constructor(func) {
    if (typeof func !== 'function') {
      throw new TypeError('Stopwatch requires a function as parameter');
    }
    
    /** @type {Function} */
    this.func = func;
    
    /** @type {Timer} */
    this.timer = new Timer();
    
    /** @type {boolean} */
    this.isRunning = false;
  }

  /**
   * Creates a new Stopwatch instance from a function
   * @param {Function} func - The function to measure
   * @returns {Stopwatch} New Stopwatch instance
   */
  static fromFunc(func) {
    return new Stopwatch(func);
  }

  /**
   * Creates and runs a new Stopwatch instance
   * @param {Function} func - The function to measure
   * @returns {Promise<Stopwatch>} The stopped stopwatch instance
   */
  static async startNew(func) {
    const stopwatch = new Stopwatch(func);
    await stopwatch.run();
    return stopwatch;
  }

  /**
   * Creates and runs a new Stopwatch instance multiple times
   * @param {Function} func - The function to measure
   * @param {number} times - Number of times to run the function
   * @returns {Promise<Stopwatch>} The stopped stopwatch instance
   */
  static async startNewXT(func, times) {
    const stopwatch = new Stopwatch(func);
    await stopwatch.runXT(times);
    return stopwatch;
  }

  /**
   * Measures the execution time of a function
   * @param {Function} func - The function to measure
   * @returns {Promise<number>} Execution time in milliseconds
   */
  static async measure(func) {
    const stopwatch = new Stopwatch(func);
    return await stopwatch.run();
  }

  /**
   * Measures the total execution time of a function run multiple times
   * @param {Function} func - The function to measure
   * @param {number} times - Number of times to run the function
   * @returns {Promise<number>} Total execution time in milliseconds
   */
  static async measureXT(func, times) {
    const stopwatch = new Stopwatch(func);
    return await stopwatch.runXT(times);
  }

  /**
   * Runs the function once and measures its execution time
   * @returns {Promise<number>} Execution time in milliseconds
   */
  async run() {
    if (this.isRunning) {
      console.warn('Stopwatch is already running');
      return 0;
    }
    
    this.isRunning = true;
    this.timer.start();
    
    try {
      await this.func();
      return this.timer.stop();
    } catch (error) {
      this.timer.stop();
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Runs the function multiple times and measures the total execution time
   * @param {number} times - Number of times to run the function
   * @returns {Promise<number>} Total execution time in milliseconds
   */
  async runXT(times) {
    if (this.isRunning) {
      console.warn('Stopwatch is already running');
      return 0;
    }
    
    if (!Number.isInteger(times) || times <= 0) {
      throw new RangeError('Times must be a positive integer');
    }
    
    this.isRunning = true;
    this.timer.start();
    
    try {
      for (let i = 0; i < times; i++) {
        await this.func();
      }
      return this.timer.stop();
    } catch (error) {
      this.timer.stop();
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Runs the function and returns a formatted time string
   * @returns {Promise<string>} Formatted time string (e.g., "Elapsed: 1.23sec(s)")
   */
  async runAndFormat() {
    const elapsed = await this.run();
    return `Elapsed: ${(elapsed / 1000).toFixed(2)}sec(s)`;
  }
}

/**
 * A ticker utility for running functions at a specified interval
 */
class Ticker {
  /**
   * @param {Function} func - The function to execute on each tick
   * @param {number} interval - Interval between ticks in milliseconds
   */
  constructor(func, interval) {
    if (typeof func !== 'function') {
      throw new TypeError('Ticker requires a function as first parameter');
    }
    
    if (typeof interval !== 'number' || interval <= 0) {
      throw new RangeError('Interval must be a positive number');
    }
    
    /** @type {Stopwatch} */
    this.stopwatch = Stopwatch.fromFunc(func);
    
    /** @type {number} */
    this.interval = interval;
    
    /** @type {Object} */
    this.report = {
      time: 0,
      expected: 0,
      avgDelta: 0,
      times: 0,
    };
    
    /** @type {boolean} */
    this.isRunning = false;
    
    /** @type {number|null} */
    this.timeoutId = null;
  }

  /**
   * Creates a new Ticker instance from a function and interval
   * @param {Function} func - The function to execute on each tick
   * @param {number} interval - Interval between ticks in milliseconds
   * @returns {Ticker} New Ticker instance
   */
  static fromFunc(func, interval) {
    return new Ticker(func, interval);
  }

  /**
   * Gets a detailed report of the ticker's performance
   * @returns {Object} Performance metrics
   * @property {number} time - Total time elapsed in milliseconds
   * @property {number} expected - Expected time based on interval
   * @property {number} avgDelta - Average time between ticks
   * @property {number} avgLag - Average lag per tick
   * @property {number} lagPercentage - Percentage of time spent in lag
   * @property {number} runs - Number of ticks completed
   * @property {number} rps - Runs per second
   */
  getDetailedReport() {
    const { time, expected, avgDelta, times } = this.report;
    const lag = Math.max(0, avgDelta - this.interval);
    const lagPercentage = Math.max(0, (avgDelta - this.interval) / this.interval) * 100;
    const rps = (times * 1000) / Math.max(1, time);
    
    return {
      time,
      expected,
      avgDelta,
      avgLag: lag,
      lagPercentage,
      runs: times,
      rps
    };
  }

  /**
   * Gets a formatted string of the ticker's performance
   * @returns {string} Formatted performance string
   */
  getReportString() {
    const report = this.getDetailedReport();
    return `RPS: ${report.rps.toFixed(2)}, ` +
           `Lag: ${report.avgLag.toFixed(2)}ms, ` +
           `Lag Percentage: ${report.lagPercentage.toFixed(2)}%`;
  }

  /**
   * Runs the ticker for a specific number of times
   * @param {number} times - Number of times to run the function
   * @returns {Promise<Object>} Performance report
   */
  async runXT(times) {
    if (this.isRunning) {
      console.warn('Ticker is already running');
      return this.report;
    }
    
    if (!Number.isInteger(times) || times <= 0) {
      throw new RangeError('Times must be a positive integer');
    }
    
    this.isRunning = true;
    this.reset();
    this.report.times = times;
    
    try {
      for (let i = 0; i < times && this.isRunning; i++) {
        const lag = await this.stopwatch.run();
        this.report.time += lag;
        
        // Calculate sleep time, ensuring it's not negative
        const sleepTime = Math.max(0, this.interval - lag);
        if (sleepTime > 0) {
          await sleep(sleepTime);
        }
      }
      
      this.report.expected = times * this.interval;
      this.report.avgDelta = this.report.time / Math.max(1, times);
      
      return this.report;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Runs the ticker continuously until stopped
   * @returns {Promise<Object>} Performance report
   */
  async runContinuously() {
    if (this.isRunning) {
      console.warn('Ticker is already running');
      return this.report;
    }
    
    this.isRunning = true;
    this.reset();
    
    try {
      while (this.isRunning) {
        const lag = await this.stopwatch.run();
        this.report.time += lag;
        this.report.expected += this.interval;
        this.report.times++;
        this.report.avgDelta = this.report.time / this.report.times;
        
        // Calculate sleep time, ensuring it's not negative
        const sleepTime = Math.max(0, this.interval - lag);
        if (sleepTime > 0) {
          await sleep(sleepTime);
        }
      }
      
      return this.report;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Stops the ticker
   */
  stop() {
    this.isRunning = false;
  }

  /**
   * Resets the ticker's internal state
   */
  reset() {
    this.report = {
      time: 0,
      expected: 0,
      avgDelta: 0,
      times: 0,
    };
  }
}

/**
 * Sleeps for the specified number of milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>} Resolves after the specified time
 */
function sleep(ms) {
  if (typeof ms !== 'number' || ms < 0) {
    throw new RangeError('Sleep time must be a non-negative number');
  }
  
  return new Promise((resolve) => {
    if (ms === 0) {
      // Use setTimeout with 0 for consistency in the event loop
      setTimeout(resolve, 0);
    } else {
      setTimeout(resolve, ms);
    }
  });
}

/**
 * A simple timer utility for measuring time intervals
 */
class Timer {
  constructor() {
    /** @type {boolean} */
    this.isRunning = false;
    
    /** @type {number} */
    this.startTime = 0;
    
    /** @type {number} */
    this.endTime = 0;
  }

  /**
   * Creates and starts a new Timer instance
   * @returns {Timer} The started timer instance
   */
  static startNew() {
    const timer = new Timer();
    timer.start();
    return timer;
  }

  /**
   * Starts the timer
   * @returns {boolean} True if started, false if already running
   */
  start() {
    if (this.isRunning) return false;
    
    this.startTime = performance.now();
    this.endTime = 0;
    this.isRunning = true;
    return true;
  }

  /**
   * Stops the timer and returns the elapsed time
   * @returns {number} Elapsed time in milliseconds, or 0 if not started
   */
  stop() {
    if (!this.isRunning) return 0;
    
    this.endTime = performance.now();
    this.isRunning = false;
    return this.endTime - this.startTime;
  }
  
  /**
   * Gets the current elapsed time without stopping the timer
   * @returns {number} Elapsed time in milliseconds, or 0 if not started
   */
  getElapsed() {
    if (!this.isRunning) return 0;
    return performance.now() - this.startTime;
  }
  
  /**
   * Restarts the timer
   * @returns {number} The elapsed time before restarting, or 0 if not started
   */
  restart() {
    const elapsed = this.stop();
    this.start();
    return elapsed;
  }
}

/**
 * @typedef {Object} PerformanceUtils
 * @property {typeof PerformanceRecorder} PerformanceRecorder - Performance recorder class
 * @property {typeof PerformanceRecord} PerformanceRecord - Performance record class
 * @property {typeof Stopwatch} Stopwatch - Stopwatch utility class
 * @property {typeof Ticker} Ticker - Ticker utility class
 * @property {typeof Timer} Timer - Timer utility class
 * @property {typeof sleep} sleep - Sleep utility function
 */

// Named exports
export { PerformanceRecorder, PerformanceRecord, Stopwatch, Ticker, Timer, sleep };

// Default export with all utilities
export default {
  PerformanceRecorder,
  PerformanceRecord,
  Stopwatch,
  Ticker,
  Timer,
  sleep
};
