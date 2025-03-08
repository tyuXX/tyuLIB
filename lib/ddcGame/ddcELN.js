class ExtremelyLargeNumber {
    // Modified constructor to initialize via a normal number or scientific notation string.
    constructor(n) {
        if (typeof n === 'number') {
            if (n <= 0) { 
                this.mantissa = 0;
                this.exponent = 0;
            } else {
                const log10 = Math.log10(n);
                this.exponent = Math.floor(log10);
                this.mantissa = n / Math.pow(10, this.exponent);
            }
        } else if (typeof n === 'string') {
            // Expecting format "mantissaeexponent" (e.g., "1.23e45")
            const parts = n.split('e');
            this.mantissa = parseFloat(parts[0]);
            this.exponent = parseInt(parts[1], 10);
        } else {
            this.mantissa = 0;
            this.exponent = 0;
        }
    }

    // Adds another ExtremelyLargeNumber.
    add(other) {
        // If exponents differ greatly, return the larger magnitude.
        if (Math.abs(this.exponent - other.exponent) > 15) {
            return this.exponent > other.exponent ? new ExtremelyLargeNumber(this.toString()) : new ExtremelyLargeNumber(other.toString());
        }
        // Otherwise convert both to a regular number, add them, and re-normalize.
        const sum = (this.mantissa * Math.pow(10, this.exponent)) + (other.mantissa * Math.pow(10, other.exponent));
        return new ExtremelyLargeNumber(sum);
    }

    // Multiplies by another ExtremelyLargeNumber.
    multiply(other) {
        let newMantissa = this.mantissa * other.mantissa;
        let newExponent = this.exponent + other.exponent;
        // Normalize result.
        if (newMantissa >= 10) {
            const shift = Math.floor(Math.log10(newMantissa));
            newMantissa = newMantissa / Math.pow(10, shift);
            newExponent += shift;
        } else if (newMantissa && newMantissa < 1) {
            const shift = Math.floor(Math.log10(newMantissa));
            newMantissa = newMantissa / Math.pow(10, shift);
            newExponent += shift;
        }
        const result = new ExtremelyLargeNumber(0);
        result.mantissa = newMantissa;
        result.exponent = newExponent;
        return result;
    }

    // Subtracts another ExtremelyLargeNumber.
    subtract(other) {
        // For large exponent differences, return approximation.
        if (Math.abs(this.exponent - other.exponent) > 15) {
            if (this.exponent > other.exponent) {
                return new ExtremelyLargeNumber(this.toString());
            } else {
                const res = new ExtremelyLargeNumber(other.toString());
                res.mantissa = -res.mantissa;
                return res;
            }
        }
        const commonExp = Math.max(this.exponent, other.exponent);
        const adjThis = this.mantissa * Math.pow(10, this.exponent - commonExp);
        const adjOther = other.mantissa * Math.pow(10, other.exponent - commonExp);
        let diffMantissa = adjThis - adjOther;
        if (diffMantissa === 0) return new ExtremelyLargeNumber(0);
        // Normalize result.
        const shift = Math.floor(Math.log10(Math.abs(diffMantissa)));
        diffMantissa = diffMantissa / Math.pow(10, shift);
        const result = new ExtremelyLargeNumber(0);
        result.mantissa = diffMantissa;
        result.exponent = commonExp + shift;
        return result;
    }

    // Raises the number to a floating point power.
    pow(exp) {
        // (m*10^e)^p = m^p * 10^(e*p)
        let newMantissa = Math.pow(this.mantissa, exp);
        let newExponent = this.exponent * exp;
        // Normalize if possible.
        if (newMantissa !== 0) {
            const shift = Math.floor(Math.log10(Math.abs(newMantissa)));
            newMantissa = newMantissa / Math.pow(10, shift);
            newExponent += shift;
        }
        const result = new ExtremelyLargeNumber(0);
        result.mantissa = newMantissa;
        result.exponent = newExponent;
        return result;
    }

    // Rounds the mantissa to 'decimals' decimal places.
    round(decimals) {
        const factor = Math.pow(10, decimals);
        const newMantissa = Math.round(this.mantissa * factor) / factor;
        const result = new ExtremelyLargeNumber(0);
        result.mantissa = newMantissa;
        result.exponent = this.exponent;
        // Re-normalize if rounding alters the mantissa.
        if (Math.abs(newMantissa) >= 10 || (newMantissa !== 0 && Math.abs(newMantissa) < 1)) {
            const shift = Math.floor(Math.log10(Math.abs(newMantissa)));
            result.mantissa = newMantissa / Math.pow(10, shift);
            result.exponent += shift;
        }
        return result;
    }

    // Returns the square root using the pow method.
    sqrt() {
        return this.pow(0.5);
    }

    // Returns the string representation in "mantissaeexponent" format.
    toString() {
        return `${this.mantissa}e${this.exponent}`;
    }
    
    // ...additional methods as needed...
}

export { ExtremelyLargeNumber };