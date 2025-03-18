class LargeNumber {
    // Modified constructor to initialize via a normal number or scientific notation string.
    constructor(n) {
        if (typeof n === 'number') {
            if (n === 0) {
                this.sign = 0;
                this.mantissa = 0;
                this.exponent = 0;
            } else {
                this.sign = n < 0 ? -1 : 1;
                const absVal = Math.abs(n);
                const log10 = Math.log10(absVal);
                this.exponent = Math.floor(log10);
                this.mantissa = absVal / Math.pow(10, this.exponent);
            }
        } else if (typeof n === 'string') {
            let str = n.trim();
            if (str[0] === '-') {
                this.sign = -1;
                str = str.slice(1);
            } else {
                this.sign = 1;
            }
            // Expecting format "mantissaeexponent" (e.g., "1.23e45")
            const parts = str.split('e');
            this.mantissa = parseFloat(parts[0]);
            this.exponent = parseInt(parts[1], 10);
            if (this.mantissa === 0) {
                this.sign = 0;
            }
        } else {
            this.sign = 1;
            this.mantissa = 0;
            this.exponent = 0;
        }
    }

    // Adds another LargeNumber.
    add(other) {
        // If exponents differ greatly, return the larger magnitude.
        if (Math.abs(this.exponent - other.exponent) > 15) {
            return this.exponent > other.exponent ? new LargeNumber(this.toString()) : new LargeNumber(other.toString());
        }
        // Otherwise convert both to a regular number, add them, and re-normalize.
        const sum = (this.mantissa * Math.pow(10, this.exponent)) + (other.mantissa * Math.pow(10, other.exponent));
        return new LargeNumber(sum);
    }

    // Multiplies by another LargeNumber.
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
        const result = new LargeNumber(0);
        result.mantissa = newMantissa;
        result.exponent = newExponent;
        return result;
    }

    // Subtracts another LargeNumber.
    subtract(other) {
        // For large exponent differences, return approximation.
        if (Math.abs(this.exponent - other.exponent) > 15) {
            if (this.exponent > other.exponent) {
                return new LargeNumber(this.toString());
            } else {
                const res = new LargeNumber(other.toString());
                res.mantissa = -res.mantissa;
                return res;
            }
        }
        const commonExp = Math.max(this.exponent, other.exponent);
        const adjThis = this.mantissa * Math.pow(10, this.exponent - commonExp);
        const adjOther = other.mantissa * Math.pow(10, other.exponent - commonExp);
        let diffMantissa = adjThis - adjOther;
        if (diffMantissa === 0) return new LargeNumber(0);
        // Normalize result.
        const shift = Math.floor(Math.log10(Math.abs(diffMantissa)));
        diffMantissa = diffMantissa / Math.pow(10, shift);
        const result = new LargeNumber(0);
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
        const result = new LargeNumber(0);
        result.mantissa = newMantissa;
        result.exponent = newExponent;
        return result;
    }

    // Rounds the mantissa to 'decimals' decimal places.
    round(decimals) {
        const factor = Math.pow(10, decimals);
        const newMantissa = Math.round(this.mantissa * factor) / factor;
        const result = new LargeNumber(0);
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
        const numStr = `${this.mantissa}e${this.exponent}`;
        return this.sign < 0 ? '-' + numStr : numStr;
    }
    
    // ...additional methods as needed...
}

class ExtremelyLargeNumber {
    // layer: 0 means a normal number, ≥1 means stored as an exponential tower.
    constructor(n) {
        // Handle numeric input.
        if (typeof n === 'number') {
            this.layer = 0;
            this.value = new LargeNumber(n);
        }
        // Handle string input with custom "^^" exponential tower notation.
        else if (typeof n === 'string') {
            const parts = n.split('^^');
            if (parts.length === 1) {
                this.layer = 0;
                this.value = new LargeNumber(n);
            } else {
                this.layer = parts.length - 1;
                // The last part is the stored value.
                this.value = new LargeNumber(parts[parts.length - 1]);
            }
            this.tryToLayer();
        }
        // Fallback copy constructor.
        else if (n instanceof ExtremelyLargeNumber) {
            this.layer = n.layer;
            this.value = n.value;
            this.tryToLayer();
        }
        else if (n instanceof LargeNumber) {
            this.layer = 0;
            this.value = n;
            this.tryToLayer();
        }
        else {
            this.layer = 0;
            this.value = new LargeNumber(0);
        }
    }
    
    // Multiplies two ExtremelyLargeNumbers if they have the same layer;
    // otherwise returns the one with the higher layer.
    multiply(other) {
        if (this.layer !== other.layer) {
            return this.layer > other.layer ? this : other;
        }
        const result = new ExtremelyLargeNumber(0);
        result.layer = this.layer;
        if (this.layer === 0) {
            result.value = this.value.multiply(other.value);
        } else if (this.layer === 1) {
            // Numbers represented as 10^(this.value); multiplication gives 10^(a+b).
            result.value = this.value.add(other.value);
        } else {
            // For higher layers, further operations would be defined.
            result.value = this.value; 
        }
        result.tryToLayer();
        return result;
    }
    
    // New method: add, delegates to LargeNumber.add
    add(other) {
        if (this.layer !== other.layer) {
            return this.layer > other.layer ? this : other;
        }
        const result = new ExtremelyLargeNumber(0);
        result.layer = this.layer;
        result.value = this.value.add(other.value);
        result.tryToLayer();
        return result;
    }
    
    // New method: subtract, delegates to LargeNumber.subtract
    subtract(other) {
        if (this.layer !== other.layer) {
            if (this.layer > other.layer) {
                return new ExtremelyLargeNumber(this.toString());
            } else {
                const res = new ExtremelyLargeNumber(other.toString());
                res.value.mantissa = -res.value.mantissa;
                return res;
            }
        }
        const result = new ExtremelyLargeNumber(0);
        result.layer = this.layer;
        result.value = this.value.subtract(other.value);
        result.tryToLayer();
        return result;
    }
    
    // New method: pow, delegates to LargeNumber.pow
    pow(exp) {
        const result = new ExtremelyLargeNumber(0);
        result.layer = this.layer;
        result.value = this.value.pow(exp);
        result.tryToLayer();
        return result;
    }
    
    // New method: round, delegates to LargeNumber.round
    round(decimals) {
        const result = new ExtremelyLargeNumber(0);
        result.layer = this.layer;
        result.value = this.value.round(decimals);
        result.tryToLayer();
        return result;
    }
    
    // New method: sqrt, using the pow method
    sqrt() {
        const result = this.pow(0.5);
        result.tryToLayer();
        return result;
    }
    
    // Returns a string representation. For layer 0, returns the LargeNumber's string.
    // For layer ≥1, uses "10^^" notation.
    toString() {
        if (this.layer === 0) {
            return this.value.toString();
        }
        else if(this.layer > 10){
            return `10#${this.layer}^^${this.value.toString()}`;
        } 
        else {
            return `10${"^^".repeat(this.layer)}${this.value.toString()}`;
        }
    }
    tryToLayer(){
        // Promote the number while the underlying value is huge.
        // That is, while the exponent is at least 308, promote to the next layer.
        while (this.value.exponent >= Math.pow(10, 7)) {
            // Compute log10(n) = log10(mantissa) + exponent.
            const newVal = this.value.exponent + Math.log10(this.value.mantissa);
            this.value = new LargeNumber(newVal);
            this.layer++;
        }
    }
}

class StupendouslyLargeNumber {
    constructor(n) {
        // Accept number, string, ExtremelyLargeNumber, or StupendouslyLargeNumber.
        if (typeof n === 'number') {
            this.ultraLayer = 0;
            this.value = new ExtremelyLargeNumber(n);
        } else if (typeof n === 'string') {
            // If string starts with custom marker "10##", parse ultraLayer.
            if (n.startsWith("10##")) {
                let [, rest] = n.split("10##");
                const parts = rest.split("^^");
                this.ultraLayer = parseInt(parts[0], 10);
                this.value = new ExtremelyLargeNumber(parts.slice(1).join("^^"));
            } else {
                this.ultraLayer = 0;
                this.value = new ExtremelyLargeNumber(n);
            }
        } else if (n instanceof StupendouslyLargeNumber) {
            this.ultraLayer = n.ultraLayer;
            this.value = n.value;
        } else if (n instanceof ExtremelyLargeNumber) {
            this.ultraLayer = 0;
            this.value = n;
        } else {
            this.ultraLayer = 0;
            this.value = new ExtremelyLargeNumber(0);
        }
        this.tryToUltraLayer();
    }
    
    tryToUltraLayer() {
        // Promote to a higher ultraLayer while the underlying ExtremelyLargeNumber has a high layer.
        while (this.value.layer >= 1000) {
            // Compute new value from the underlying value (using its exponent and mantissa).
            const newVal = this.value.value.exponent + Math.log10(this.value.value.mantissa);
            this.value = new ExtremelyLargeNumber(newVal);
            this.ultraLayer++;
        }
    }
    
    multiply(other) {
        if (this.ultraLayer !== other.ultraLayer) {
            return this.ultraLayer > other.ultraLayer ? this : other;
        }
        const result = new StupendouslyLargeNumber(0);
        result.ultraLayer = this.ultraLayer;
        result.value = this.value.multiply(other.value);
        result.tryToUltraLayer();
        return result;
    }
    
    // Updated add method.
    add(other) {
        if (this.ultraLayer !== other.ultraLayer) {
            // Determine the number with the higher ultraLayer.
            const higher = this.ultraLayer > other.ultraLayer ? this : other;
            // Return a new instance constructed from its string representation.
            return new StupendouslyLargeNumber(higher.toString());
        }
        const result = new StupendouslyLargeNumber(0);
        result.ultraLayer = this.ultraLayer;
        result.value = this.value.add(other.value);
        result.tryToUltraLayer();
        return result;
    }
    
    subtract(other) {
        if (this.ultraLayer !== other.ultraLayer) {
            if (this.ultraLayer > other.ultraLayer) {
                return new StupendouslyLargeNumber(this.toString());
            } else {
                const res = new StupendouslyLargeNumber(other.toString());
                // Negate the underlying value's mantissa as an approximation.
                res.value.value.mantissa = -res.value.value.mantissa;
                return res;
            }
        }
        const result = new StupendouslyLargeNumber(0);
        result.ultraLayer = this.ultraLayer;
        result.value = this.value.subtract(other.value);
        result.tryToUltraLayer();
        return result;
    }
    
    pow(exp) {
        const result = new StupendouslyLargeNumber(0);
        result.ultraLayer = this.ultraLayer;
        result.value = this.value.pow(exp);
        result.tryToUltraLayer();
        return result;
    }
    
    sqrt() {
        return this.pow(0.5);
    }
    
    round(decimals) {
        const result = new StupendouslyLargeNumber(0);
        result.ultraLayer = this.ultraLayer;
        result.value = this.value.round(decimals);
        result.tryToUltraLayer();
        return result;
    }
    
    toString() {
        if (this.ultraLayer === 0) {
            return this.value.toString();
        } else {
            return `10##${this.ultraLayer}^^${this.value.toString()}`;
        }
    }
}

class LayeredNumber {
    constructor(n) {
        
    }
}


export { LargeNumber, ExtremelyLargeNumber, StupendouslyLargeNumber };