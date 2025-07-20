class DDCNumber{}

// When using, please override all methods.
class DerivedNumberType extends DDCNumber {
    constructor(value, sign = undefined) {
        super();    
        this.inheritance = typeof(value);
        this.name = typeof(this);
        if(sign){
            this.sign = sign;
        }

        // This doesn't have to be used for derived types, simply here for example.
        this.value = value;
    }

    static E = new DerivedNumberType(Math.E);

    // Standard methods
    add(_n){return "NYI";}
    subtract(_n){return ;}
    multiply(_n){return "NYI";}
    divide(_n){return "NYI";}
    divideBy(_n){return "NYI";}

    // Numeric methods
    min(_n){return "NYI";}
    max(_n){return "NYI";}
    abs(){return "NYI";}
    round(){return "NYI";}
    floor(){return "NYI";}
    ceil(){return "NYI";}

    // Exponential methods
    log(_base){return "NYI";}
    log10(){return this.log(10);}
    exp(){return E.pow(this);}
    pow(_exponent){return "NYI";}
    sqrt(){return this.root(2);}
    root(exponent){return this.pow(exponent.divide(1));}

    // Trigonometric methods
    sin(){return "NYI";}
    cos(){return "NYI";}
    tan(){return "NYI";}
    asin(){return "NYI";}
    acos(){return "NYI";}
    atan(){return "NYI";}

    // Value methods
    static parse(){return "NYI";}
    toString(){return this.value.toString();}
    valueOf(){return this.value;}
    toLocaleString(){return "NYI";}
    toExponential(){return "NYI";}
    toFixed(){return "NYI";}

    // Additional methods can be added if needed...

    // Symbol methods
    [Symbol.toStringTag] = this.name;
    [Symbol.toNumber](){return this.valueOf();}
    [Symbol.toPrimitive](hint) {
        switch (hint) {
            case "number":
                return this.valueOf();
            case "string":
                return this.toString();
            default:
                return this.toString();
        }
    }
}

// LargeNumber class to handle very large numbers using mantissa-exponent representation
class LargeNumber extends DerivedNumberType {
    /**
     * Create a LargeNumber
     * @param {number|string|Object} value - Can be a number, string, or {mantissa, exponent} object
     * @param {number} [exponent] - Optional exponent if first param is mantissa
     */
    constructor(value, exponent = 0) {
        let mantissa = 0;
        
        if (value !== undefined && value !== null) {
            // Handle different input types
            if (typeof value === 'object' && 'mantissa' in value && 'exponent' in value) {
                mantissa = value.mantissa;
                exponent = value.exponent;
            } else if (typeof value === 'string') {
                // Parse scientific notation strings like "1.23e45"
                const parts = value.toLowerCase().split('e');
                mantissa = parseFloat(parts[0]);
                if (parts[1]) exponent = parseInt(parts[1], 10);
            } else if (typeof value === 'number' || typeof value === 'bigint') {
                mantissa = Number(value);
            }
        }
        
        // Normalize the number (mantissa between 1 and 10, or 0)
        if (mantissa !== 0) {
            const absMantissa = Math.abs(mantissa);
            const exp = Math.floor(Math.log10(absMantissa));
            mantissa = mantissa / Math.pow(10, exp);
            exponent += exp;
        } else {
            exponent = 0;
        }
        
        super(mantissa);
        this.mantissa = mantissa;
        this.exponent = exponent;
    }
    
    // Core arithmetic operations
    add(other) {
        if (!(other instanceof LargeNumber)) other = new LargeNumber(other);
        
        // If exponents are too far apart, just return the larger number
        const expDiff = this.exponent - other.exponent;
        if (Math.abs(expDiff) > 15) {
            return expDiff > 0 ? this : other;
        }
        
        // Align exponents and add
        const [smaller, larger] = this.exponent < other.exponent 
            ? [this, other] 
            : [other, this];
            
        const shift = larger.exponent - smaller.exponent;
        const newMantissa = larger.mantissa + (smaller.mantissa / Math.pow(10, shift));
        
        return new LargeNumber(newMantissa, larger.exponent);
    }
    
    subtract(other) {
        if (!(other instanceof LargeNumber)) other = new LargeNumber(other);
        return this.add(other.negate());
    }
    
    multiply(other) {
        if (!(other instanceof LargeNumber)) other = new LargeNumber(other);
        const mantissa = this.mantissa * other.mantissa;
        const exponent = this.exponent + other.exponent;
        return new LargeNumber(mantissa, exponent);
    }
    
    divide(other) {
        if (!(other instanceof LargeNumber)) other = new LargeNumber(other);
        if (other.mantissa === 0) throw new Error('Division by zero');
        
        const mantissa = this.mantissa / other.mantissa;
        const exponent = this.exponent - other.exponent;
        return new LargeNumber(mantissa, exponent);
    }
    
    // Utility methods
    negate() {
        return new LargeNumber(-this.mantissa, this.exponent);
    }
    
    abs() {
        return new LargeNumber(Math.abs(this.mantissa), this.exponent);
    }
    
    // Comparison methods
    compareTo(other) {
        if (!(other instanceof LargeNumber)) other = new LargeNumber(other);
        
        if (this.exponent > other.exponent) return 1;
        if (this.exponent < other.exponent) return -1;
        if (this.mantissa > other.mantissa) return 1;
        if (this.mantissa < other.mantissa) return -1;
        return 0;
    }
    
    equals(other) {
        if (!(other instanceof LargeNumber)) other = new LargeNumber(other);
        return this.mantissa === other.mantissa && this.exponent === other.exponent;
    }
    
    // Conversion methods
    toNumber() {
        if (this.exponent > 20) return Infinity;
        if (this.exponent < -20) return 0;
        return this.mantissa * Math.pow(10, this.exponent);
    }
    
    toString() {
        if (this.mantissa === 0) return '0';
        
        // For very large/small numbers, use scientific notation
        if (this.exponent > 20 || this.exponent < -6) {
            // First get the mantissa with 4 significant digits
            let mantissaStr = Math.abs(this.mantissa).toPrecision(4);
            
            // Remove trailing zeros after decimal point
            if (mantissaStr.includes('.')) {
                mantissaStr = mantissaStr.replace(/(\.\d*?[1-9])0+$|(\.0+)$/, '$1');
                // Remove decimal point if nothing after it
                mantissaStr = mantissaStr.replace(/\.$/, '');
            }
            
            // Add sign back
            const sign = this.mantissa < 0 ? '-' : '';
            return `${sign}${mantissaStr}e${this.exponent}`;
        }
        
        // For reasonable sized numbers, use fixed notation and remove trailing zeros
        const num = this.mantissa * Math.pow(10, this.exponent);
        return num.toString().replace(/(\.\d*?[1-9])0+$|(\.0+)$/, '$1').replace(/\.$/, '');
    }
    
    toJSON() {
        return {
            mantissa: this.mantissa,
            exponent: this.exponent
        };
    }
    
    // Static methods for convenience
    static fromString(str) {
        return new LargeNumber(str);
    }
    
    static fromJSON(obj) {
        return new LargeNumber(obj);
    }
    
    // Operator overloading helpers
    valueOf() {
        return this.toNumber();
    }
    
    [Symbol.toPrimitive](hint) {
        if (hint === 'number') return this.toNumber();
        return this.toString();
    }
    
    // Implement required abstract methods from parent
    pow(exponent) {
        if (!(exponent instanceof LargeNumber)) exponent = new LargeNumber(exponent);
        
        // For integer exponents, use repeated multiplication
        if (exponent.exponent === 0 && Number.isInteger(exponent.mantissa)) {
            const n = Math.abs(exponent.mantissa);
            let result = new LargeNumber(1);
            for (let i = 0; i < n; i++) {
                result = result.multiply(this);
            }
            return exponent.mantissa >= 0 ? result : new LargeNumber(1).divide(result);
        }
        
        // For non-integer exponents, use log/exp
        // This is an approximation and loses precision for very large numbers
        const logValue = Math.log10(Math.abs(this.mantissa)) + this.exponent;
        const resultExp = logValue * exponent.mantissa * Math.pow(10, exponent.exponent);
        const resultMantissa = Math.sign(this.mantissa) * Math.pow(10, resultExp % 1);
        return new LargeNumber(resultMantissa, Math.floor(resultExp));
    }
    
    // Implement other required methods with reasonable defaults
    log(base = 10) {
        if (this.mantissa <= 0) return new LargeNumber(NaN);
        
        const logValue = Math.log10(this.mantissa) + this.exponent;
        if (base === 10) return new LargeNumber(logValue);
        
        const logBase = Math.log10(base);
        return new LargeNumber(logValue / logBase);
    }
    
    // Implement other required methods with reasonable defaults
    floor() {
        if (this.exponent >= 0) return this;
        if (this.exponent < -15) return new LargeNumber(0);
        
        const factor = Math.pow(10, -this.exponent);
        return new LargeNumber(Math.floor(this.mantissa * factor) / factor);
    }
    
    ceil() {
        if (this.exponent >= 0) return this;
        if (this.exponent < -15) return new LargeNumber(1);
        
        const factor = Math.pow(10, -this.exponent);
        return new LargeNumber(Math.ceil(this.mantissa * factor) / factor);
    }
    
    round() {
        if (this.exponent >= 0) return this;
        if (this.exponent < -15) return new LargeNumber(Math.round(this.mantissa * Math.pow(10, this.exponent + 15)) / Math.pow(10, 15));
        
        const factor = Math.pow(10, -this.exponent);
        return new LargeNumber(Math.round(this.mantissa * factor) / factor);
    }
}

// Add static constants
LargeNumber.ZERO = new LargeNumber(0);
LargeNumber.ONE = new LargeNumber(1);
LargeNumber.INFINITY = new LargeNumber(Infinity)

export { DDCNumber, DerivedNumberType, LargeNumber };